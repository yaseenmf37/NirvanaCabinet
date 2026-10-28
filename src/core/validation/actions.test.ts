import test from "node:test";
import assert from "node:assert/strict";
import { isActionType, isProjectStage, isProjectStatus, normalizeProgress, validateProjectText, validateWorkflowTitle } from "./actions.ts";

test("action validation trims and bounds text", () => {
  assert.equal(validateWorkflowTitle("  وظیفه  "), "وظیفه");
  assert.equal(validateWorkflowTitle(""), null);
  assert.equal(validateProjectText("  مشتری  "), "مشتری");
  assert.equal(validateProjectText("x".repeat(161)), null);
});

test("action validation accepts FAQ publishing action", () => {
  assert.equal(isActionType("publish_faq_answer"), true);
  assert.equal(isActionType("unknown_action"), false);
});
test("action validation normalizes progress and enums", () => {
  assert.equal(normalizeProgress(-10, 20), 0);
  assert.equal(normalizeProgress(150, 20), 100);
  assert.equal(normalizeProgress("bad", 20), null);
  assert.equal(normalizeProgress(undefined, 20), 20);
  assert.equal(isProjectStage("planning"), true);
  assert.equal(isProjectStage("unknown"), false);
  assert.equal(isProjectStatus("active"), true);
  assert.equal(isProjectStatus("unknown"), false);
});
