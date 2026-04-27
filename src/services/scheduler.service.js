const contentModel = require('../models/content.model');
const logger = require('../utils/logger');

class SchedulerService {
  /**
   * Calculates which content should be active for a teacher at the current time
   * 
   * Algorithm:
   * 1. Get all approved content for the teacher within their time window
   * 2. Group by subject
   * 3. For each subject:
   *    - Sort by rotation_order
   *    - Calculate total cycle duration (sum of all rotation_duration values)
   *    - Calculate elapsed time since earliest start_time
   *    - Use modulo to find position in current cycle
   *    - Find which content item is active at this position
   * 4. Return array of active content (one per subject)
   */
  async getCurrentActiveContent(teacherId) {
    const now = new Date();

    // Get all approved content for this teacher within active time window
    const eligibleContent = await contentModel.findEligibleContent(teacherId, now);

    if (eligibleContent.length === 0) {
      return [];
    }

    // Group content by subject
    const bySubject = this._groupBySubject(eligibleContent);

    const activeContent = [];

    for (const [subject, contents] of Object.entries(bySubject)) {
      // Sort by rotation_order to ensure consistent ordering
      const sorted = contents.sort((a, b) => a.rotation_order - b.rotation_order);

      // Calculate total cycle duration in minutes
      const cycleDuration = sorted.reduce((sum, c) => sum + (c.rotation_duration || 5), 0);

      if (cycleDuration === 0) {
        logger.warn(`Subject ${subject} has zero cycle duration`);
        continue;
      }

      // Calculate elapsed time since the earliest start_time for this subject
      const referenceTime = Math.min(...sorted.map(c => c.start_time.getTime()));
      const elapsedMs = now.getTime() - referenceTime;
      const elapsedMinutes = elapsedMs / 60000;

      // Find position in current cycle using modulo
      const positionInCycle = elapsedMinutes % cycleDuration;

      // Find which content item is active at this position
      let accumulatedTime = 0;
      for (const content of sorted) {
        const duration = content.rotation_duration || 5;

        if (positionInCycle >= accumulatedTime && positionInCycle < accumulatedTime + duration) {
          activeContent.push({
            ...content,
            activeUntilMinutes: Math.ceil(accumulatedTime + duration - positionInCycle),
          });
          break;
        }

        accumulatedTime += duration;
      }
    }

    return activeContent;
  }

  /**
   * Groups content items by subject
   */
  _groupBySubject(contents) {
    return contents.reduce((acc, content) => {
      if (!acc[content.subject]) {
        acc[content.subject] = [];
      }
      acc[content.subject].push(content);
      return acc;
    }, {});
  }
}

module.exports = new SchedulerService();
