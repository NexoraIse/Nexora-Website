export const HOME_PRACTICE_CODE = `def two_sum(nums, target):
    seen = {}
    for index, value in enumerate(nums):
        complement = target - value
        if complement in seen:
            return [seen[complement], index]
        seen[value] = index
    return []`;

export const HOME_PRACTICE_TESTS = [
  { label: "case 1", input: "[2, 7, 11, 15], 9", result: "[0, 1]" },
  { label: "case 2", input: "[3, 2, 4], 6", result: "[1, 2]" },
  { label: "case 3", input: "[3, 3], 6", result: "[0, 1]" },
];

export const HOME_APTITUDE_QUESTION = {
  prompt: "If an algorithm checks each item in a list once, what is its time complexity?",
  options: ["O(1)", "O(n)", "O(log n)", "O(n²)"],
  correctIndex: 1,
  explanation: "One constant-time check per item grows linearly with the list size.",
} as const;

export const HOME_CODE_THEME = {
  name: "nexora-dark",
  type: "dark" as const,
  colors: {
    "editor.background": "#050810",
    "editor.foreground": "#E2E8F0",
  },
  tokenColors: [
    { scope: ["comment"], settings: { foreground: "#94A3B8", fontStyle: "italic" } },
    { scope: ["keyword", "storage"], settings: { foreground: "#00F0FF" } },
    { scope: ["entity.name.function"], settings: { foreground: "#E2E8F0" } },
    { scope: ["string", "constant.numeric"], settings: { foreground: "#94A3B8" } },
  ],
};
