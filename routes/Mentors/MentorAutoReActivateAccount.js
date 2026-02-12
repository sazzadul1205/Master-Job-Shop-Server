const express = require("express");
const router = express.Router();
const cron = require("node-cron");
const { client } = require("../../config/db");

// Collection for Mentors
const MentorsCollection = client.db("Master-Job-Shop").collection("Mentors");

// ---------- Service Initialization ----------
console.log(`[${new Date().toISOString()}] Mentor Reactivation Service LIVE`);

// ---------- Automated Reactivation Function ----------
const autoReactivateMentors = async () => {
  try {
    const now = new Date();

    // Find all deactivated mentors whose deactivateUntil has passed
    const mentorsToReactivate = await MentorsCollection.find({
      deactivate: true,
      deactivateUntil: { $lte: now },
    }).toArray();

    if (!mentorsToReactivate || mentorsToReactivate.length === 0) {
      console.log(`[${new Date().toISOString()}] No mentors to reactivate.`);
      return { updatedCount: 0 };
    }

    // Update each mentor
    let updatedCount = 0;
    for (const mentor of mentorsToReactivate) {
      await MentorsCollection.updateOne(
        { _id: mentor._id },
        {
          $set: { deactivate: false },
          $unset: { deactivateUntil: "" },
        }
      );
      updatedCount++;
      console.log(
        `[${new Date().toISOString()}] Mentor "${mentor.name}" (${
          mentor.email
        }) reactivated.`
      );
    }

    console.log(
      `[${new Date().toISOString()}] Auto-reactivation complete. ${updatedCount} mentor(s) updated.`
    );
    return { updatedCount };
  } catch (error) {
    console.error(
      `[${new Date().toISOString()}] Error in auto-reactivating mentors:`,
      error
    );
    return { updatedCount: 0, error };
  }
};

// ---------- Cron Job: Runs every day at midnight ----------
cron.schedule("0 0 * * *", async () => {
  console.log(
    `[${new Date().toISOString()}] Running daily Mentor Reactivation check...`
  );
  await autoReactivateMentors();
});

// ---------- Manual Trigger Endpoint ----------
router.post("/", async (req, res) => {
  try {
    const result = await autoReactivateMentors();
    if (result.error) throw result.error;

    const message =
      result.updatedCount === 0
        ? "No mentors required reactivation."
        : `${result.updatedCount} mentor(s) reactivated successfully.`;

    return res.status(200).json({ message });
  } catch (error) {
    return res.status(500).json({
      message: "Failed to perform manual reactivation.",
      error: error.message,
    });
  }
});

module.exports = router;
