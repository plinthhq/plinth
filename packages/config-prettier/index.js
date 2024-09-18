module.exports = {
    proseWrap: "preserve", // Markdown prose wrap setting
    quoteProps: "as-needed", // Only quote object properties when necessary
    printWidth: 80, // Maximum line length
    bracketSameLine: false, // Puts the `>` of multi-line HTML element at the end of the last line
    bracketSpacing: true, // Controls the printing of spaces inside object literals
    semi: true, // Add a semicolon at the end of every line
    singleAttributePerLine: false, // Don't enforce one attribute per line in HTML/JSX
    singleQuote: true, // Use double quotes instead of single quotes
    tabWidth: 2, // Number of spaces per tab
    trailingComma: "es5", // Trailing commas where valid in ES5 (objects, arrays, etc)
    useEditorConfig: true, // Take `.editorconfig` into account when parsing configuration
}