import { inArray, sql } from "drizzle-orm";
import type { WorkbookData } from "@/lib/excel";
import { splitVocabulary } from "@/lib/curriculum";
import { getDb } from "@/lib/db";
import {
  conceptDefinitions,
  evaluationCheckpoints,
  learningPhases,
  learningSources,
  lessons,
  lessonVocabularies,
} from "@/lib/db/schema";

export async function importCurriculum(data: WorkbookData) {
  const db = getDb();

  await db
    .insert(learningPhases)
    .values(data.phases)
    .onConflictDoUpdate({
      target: learningPhases.phaseNumber,
      set: {
        title: sql`excluded.title`,
        summary: sql`excluded.summary`,
        startDay: sql`excluded.start_day`,
        endDay: sql`excluded.end_day`,
      },
    });

  const phases = await db.select().from(learningPhases);
  const phaseIds = new Map(phases.map((phase) => [phase.phaseNumber, phase.id]));
  const lessonValues = data.lessons.map((lesson) => ({
    dayNumber: lesson.dayNumber,
    phaseId: phaseIds.get(lesson.phaseNumber)!,
    plannedDate: lesson.plannedDate,
    sessionType: lesson.sessionType,
    topic: lesson.topic,
    learningTarget: lesson.learningTarget,
    conceptId: lesson.conceptId,
    definition: lesson.definition,
    examples: lesson.examples,
    vocabularyReview: lesson.vocabularyReview,
    readingTitle: lesson.readingTitle,
    readingUrl: lesson.readingUrl,
    readingTask: lesson.readingTask,
    videoTitle: lesson.videoTitle,
    videoUrl: lesson.videoUrl,
    videoTask: lesson.videoTask,
    speakingTask: lesson.speakingTask,
    writingTask: lesson.writingTask,
    completionCriteria: lesson.completionCriteria,
    targetMinutes: lesson.targetMinutes,
    reviewTask: lesson.reviewTask,
    updatedAt: new Date(),
  }));

  await db
    .insert(lessons)
    .values(lessonValues)
    .onConflictDoUpdate({
      target: lessons.dayNumber,
      set: {
        phaseId: sql`excluded.phase_id`,
        plannedDate: sql`excluded.planned_date`,
        sessionType: sql`excluded.session_type`,
        topic: sql`excluded.topic`,
        learningTarget: sql`excluded.learning_target`,
        conceptId: sql`excluded.concept_id`,
        definition: sql`excluded.definition`,
        examples: sql`excluded.examples`,
        vocabularyReview: sql`excluded.vocabulary_review`,
        readingTitle: sql`excluded.reading_title`,
        readingUrl: sql`excluded.reading_url`,
        readingTask: sql`excluded.reading_task`,
        videoTitle: sql`excluded.video_title`,
        videoUrl: sql`excluded.video_url`,
        videoTask: sql`excluded.video_task`,
        speakingTask: sql`excluded.speaking_task`,
        writingTask: sql`excluded.writing_task`,
        completionCriteria: sql`excluded.completion_criteria`,
        targetMinutes: sql`excluded.target_minutes`,
        reviewTask: sql`excluded.review_task`,
        updatedAt: sql`now()`,
      },
    });

  const importedLessons = await db
    .select({ id: lessons.id, dayNumber: lessons.dayNumber })
    .from(lessons)
    .where(inArray(lessons.dayNumber, data.lessons.map((lesson) => lesson.dayNumber)));
  const lessonIds = new Map(importedLessons.map((lesson) => [lesson.dayNumber, lesson.id]));
  const ids = importedLessons.map((lesson) => lesson.id);
  if (ids.length) await db.delete(lessonVocabularies).where(inArray(lessonVocabularies.lessonId, ids));
  const vocabularyValues = data.lessons.flatMap((lesson) =>
    splitVocabulary(lesson.vocabularyReview).map((vocabulary) => ({
      lessonId: lessonIds.get(lesson.dayNumber)!,
      ...vocabulary,
    })),
  );
  if (vocabularyValues.length) await db.insert(lessonVocabularies).values(vocabularyValues);

  if (data.concepts.length) {
    await db.insert(conceptDefinitions).values(data.concepts).onConflictDoUpdate({
      target: conceptDefinitions.conceptId,
      set: {
        term: sql`excluded.term`,
        simpleDefinition: sql`excluded.simple_definition`,
        example: sql`excluded.example`,
        companionUrl: sql`excluded.companion_url`,
        usageLevel: sql`excluded.usage_level`,
      },
    });
  }
  if (data.sources.length) {
    await db.insert(learningSources).values(data.sources).onConflictDoUpdate({
      target: learningSources.sourceId,
      set: {
        title: sql`excluded.title`,
        publisher: sql`excluded.publisher`,
        type: sql`excluded.type`,
        url: sql`excluded.url`,
        checkedAt: sql`excluded.checked_at`,
        accessNotes: sql`excluded.access_notes`,
      },
    });
  }
  if (data.checkpoints.length) {
    await db.insert(evaluationCheckpoints).values(data.checkpoints).onConflictDoUpdate({
      target: evaluationCheckpoints.dayNumber,
      set: { focus: sql`excluded.focus`, nextStep: sql`excluded.next_step` },
    });
  }

  return {
    imported: importedLessons.length,
    failed: data.lessons.length - importedLessons.length,
    concepts: data.concepts.length,
    sources: data.sources.length,
    vocabularies: vocabularyValues.length,
  };
}
