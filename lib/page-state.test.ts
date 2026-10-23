import assert from "node:assert/strict";
import { pageView } from "./page-state";

assert.equal(pageView({ loading: true, error: null, data: null }), "loading");
// A refetch while previous rows are held: keep showing them (dimmed), don't flash a loader.
assert.equal(pageView({ loading: true, error: null, data: [1] }), "refreshing");
assert.equal(pageView({ loading: true, error: null, data: [] }), "refreshing");
assert.equal(pageView({ loading: false, error: "boom", data: null }), "error");
assert.equal(pageView({ loading: true, error: "boom", data: [1] }), "error");
assert.equal(pageView({ loading: false, error: null, data: null }), "empty");
assert.equal(pageView({ loading: false, error: null, data: [] }), "empty");
assert.equal(pageView({ loading: false, error: null, data: [1, 2] }), "ready");
console.log("page-state: all assertions passed");
