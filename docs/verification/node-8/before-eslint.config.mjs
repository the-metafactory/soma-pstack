export default [{
  files: ["messages.js"],
  plugins: {
    slice: { rules: {
      "no-comments": {
        meta: { type: "suggestion", schema: [], messages: { comment: "Classify this comment." } },
        create(context) {
          return { Program() {
            for (const comment of context.sourceCode.getAllComments()) {
              context.report({ loc: comment.loc, messageId: "comment" });
            }
          } };
        }
      }
    } }
  },
  rules: { "slice/no-comments": "error" }
}];
