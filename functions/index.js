const {onCall, onRequest} = require("firebase-functions/v2/https");
const {onDocumentWritten} = require("firebase-functions/v2/firestore");
const {onSchedule} = require("firebase-functions/v2/scheduler");
const {defineSecret} = require("firebase-functions/params");
const logger = require("firebase-functions/logger");
const admin = require("firebase-admin");
const {TwitterApi} = require("twitter-api-v2");
const CryptoJS = require("crypto-js");

admin.initializeApp();

// Define the secret for v2 functions
const encryptionKeySecret = defineSecret("ENCRYPTION_KEY");

// Utility function to decrypt settings
const decryptSettings = (encryptedSettings) => {
  if (!encryptionKeySecret.value()) {
    throw new Error('Encryption key not configured');
  }
  if (encryptedSettings === undefined) {
    throw new Error('Encrypted settings are undefined');
  }
  
  return {
    apiKey: CryptoJS.AES.decrypt(encryptedSettings.apiKey, encryptionKeySecret.value()).toString(CryptoJS.enc.Utf8),
    apiSecret: CryptoJS.AES.decrypt(encryptedSettings.apiSecret, encryptionKeySecret.value()).toString(CryptoJS.enc.Utf8),
    accessToken: CryptoJS.AES.decrypt(encryptedSettings.accessToken, encryptionKeySecret.value()).toString(CryptoJS.enc.Utf8),
    accessTokenSecret: CryptoJS.AES.decrypt(encryptedSettings.accessTokenSecret, encryptionKeySecret.value()).toString(CryptoJS.enc.Utf8),
    bearerToken: encryptedSettings.bearerToken ? 
      CryptoJS.AES.decrypt(encryptedSettings.bearerToken, encryptionKeySecret.value()).toString(CryptoJS.enc.Utf8) : null,
  };
};

// Function to post to X (Twitter)
exports.postToX = onCall({
  secrets: [encryptionKeySecret]
}, async (request) => {
  try {
    const {postId, content} = request.data;
    const userId = request.auth.uid;

    if (!userId) {
      throw new Error('User not authenticated');
    }

    // Get user settings
    const userSettingsRef = admin.firestore().doc(`userSettings/${userId}`);
    const userSettingsDoc = await userSettingsRef.get();

    if (!userSettingsDoc.exists) {
      throw new Error('User settings not found. Please configure your X API credentials.');
    }

    const encryptedSettings = userSettingsDoc.data();
    const settings = decryptSettings(encryptedSettings);

    // Initialize Twitter client
    const twitterClient = new TwitterApi({
      appKey: settings.apiKey,
      appSecret: settings.apiSecret,
      accessToken: settings.accessToken,
      accessSecret: settings.accessTokenSecret,
    });

    // Post to Twitter
    const tweet = await twitterClient.v2.tweet(content);

    // Update the post status in Firestore
    const postRef = admin.firestore().doc(`posts/${postId}`);
    await postRef.update({
      status: 'posted',
      tweetId: tweet.data.id,
      postedAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    logger.info(`Successfully posted to X: ${tweet.data.id}`, {
      userId,
      postId,
      tweetId: tweet.data.id
    });

    return {
      success: true,
      tweetId: tweet.data.id,
      message: 'Successfully posted to X'
    };

  } catch (error) {
    logger.error('Error posting to X:', error);
    
    // Update post status to indicate failure
    if (request.data.postId) {
      try {
        const postRef = admin.firestore().doc(`posts/${request.data.postId}`);
        await postRef.update({
          status: 'draft',
          lastError: error.message,
        });
      } catch (updateError) {
        logger.error('Error updating post status:', updateError);
      }
    }

    throw new Error(`Failed to post to X: ${error.message}`);
  }
});

// Function to test X API connection
exports.testXConnection = onCall({
  secrets: [encryptionKeySecret]
}, async (request) => {
  try {
    const userId = request.auth.uid;

    if (!userId) {
      throw new Error('User not authenticated');
    }

    // Get user settings
    const userSettingsRef = admin.firestore().doc(`userSettings/${userId}`);
    const userSettingsDoc = await userSettingsRef.get();

    if (!userSettingsDoc.exists) {
      throw new Error('User settings not found');
    }

    const encryptedSettings = userSettingsDoc.data();
    const settings = decryptSettings(encryptedSettings);

    // Test Twitter connection
    const twitterClient = new TwitterApi({
      appKey: settings.apiKey,
      appSecret: settings.apiSecret,
      accessToken: settings.accessToken,
      accessSecret: settings.accessTokenSecret,
    });

    // Try to get user info to test connection
    const user = await twitterClient.v2.me();

    return {
      success: true,
      username: user.data.username,
      message: 'X API connection successful'
    };

  } catch (error) {
    logger.error('Error testing X connection:', error);
    throw new Error(`X API connection failed: ${error.message}`);
  }
});

// Scheduled function to process scheduled posts - runs every 30 minutes
exports.processScheduledPosts = onSchedule({
  schedule: "every 2 hours",
  timeZone: "UTC",
  secrets: [encryptionKeySecret]
}, async (event) => {
  try {
    const now = admin.firestore.Timestamp.now();
    
    // Query for posts that are scheduled and ready to be posted
    const scheduledPostsQuery = admin.firestore()
      .collection('posts')
      .where('status', '==', 'scheduled')
      .where('scheduledFor', '<=', now);

    const scheduledPosts = await scheduledPostsQuery.get();

    const results = [];

    for (const postDoc of scheduledPosts.docs) {
      const postData = postDoc.data();
      const postId = postDoc.id;

      try {
        // Get user settings
        const userSettingsRef = admin.firestore().doc(`userSettings/${postData.userId}`);
        const userSettingsDoc = await userSettingsRef.get();

        if (!userSettingsDoc.exists) {
          logger.warn(`User settings not found for post ${postId}`);
          continue;
        }

        const encryptedSettings = userSettingsDoc.data();
        const settings = decryptSettings(encryptedSettings);

        // Post to Twitter
        const twitterClient = new TwitterApi({
          appKey: settings.apiKey,
          appSecret: settings.apiSecret,
          accessToken: settings.accessToken,
          accessSecret: settings.accessTokenSecret,
        });

        const tweet = await twitterClient.v2.tweet(postData.content);

        // Update post status
        await postDoc.ref.update({
          status: 'posted',
          tweetId: tweet.data.id,
          postedAt: admin.firestore.FieldValue.serverTimestamp(),
        });

        results.push({
          postId,
          success: true,
          tweetId: tweet.data.id
        });

        logger.info(`Successfully posted scheduled tweet: ${tweet.data.id}`);

      } catch (error) {
        logger.error(`Error posting scheduled tweet ${postId}:`, error);
        
        // Update post with error
        await postDoc.ref.update({
          status: 'draft',
          lastError: error.message,
        });

        results.push({
          postId,
          success: false,
          error: error.message
        });
      }
    }

    logger.info(`Processed ${results.length} scheduled posts`);
    return {
      success: true,
      processed: results.length,
      results
    };

  } catch (error) {
    logger.error('Error processing scheduled posts:', error);
    throw error;
  }
});

// Keep the hello world function for testing
exports.helloWorld = onRequest((request, response) => {
  logger.info("Hello logs!", {structuredData: true});
  response.send("Hello from Firebase!");
});
