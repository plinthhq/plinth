// Define a type for options to control the behavior of the function
export interface Options {
  ignoreId: boolean; // If true, the function ignores the 'id' attribute when generating XPath
}

// Default options if none are provided by the caller
const defaultOptions: Options = {
  ignoreId: false, // By default, the 'id' attribute will be used if available
};

// Main function to get the XPath of an HTML element
export default function getXPath(
  el: HTMLElement,
  customOptions?: Partial<Options>
): string {
  // Merge custom options with default options
  const options = { ...defaultOptions, ...customOptions };

  let nodeElem: HTMLElement | null = el;

  // If the element has an 'id' attribute and 'ignoreId' option is false,
  // we can directly return the XPath that selects by 'id'
  if (nodeElem.id && !options.ignoreId) {
    return `//*[@id="${nodeElem.id}"]`;
  }

  // Initialize an array to store parts of the XPath
  const parts: string[] = [];

  // Traverse up the DOM tree to construct the full XPath
  while (nodeElem && Node.ELEMENT_NODE === nodeElem.nodeType) {
    let nbOfPreviousSiblings = 0; // Count previous siblings of the same tag
    let hasNextSiblings = false; // Flag to check if there are next siblings of the same tag

    // The two loops traverse the siblings to determine if the current element needs a positional
    // index (e.g., [1], [2], etc.)

    // Traverse previous siblings to count how many have the same tag name
    let sibling = nodeElem.previousSibling;
    while (sibling) {
      if (
        sibling.nodeType !== Node.DOCUMENT_TYPE_NODE &&
        sibling.nodeName === nodeElem.nodeName
      ) {
        nbOfPreviousSiblings++; // Increment if the sibling has the same node name
      }
      sibling = sibling.previousSibling;
    }

    // Check for next siblings with the same tag name
    sibling = nodeElem.nextSibling;
    while (sibling) {
      if (sibling.nodeName === nodeElem.nodeName) {
        hasNextSiblings = true;
        break;
      }
      sibling = sibling.nextSibling;
    }

    // Create a prefix if the element has a namespace (e.g., 'svg:' for SVG elements)
    const prefix = nodeElem.prefix ? `${nodeElem.prefix}:` : '';

    // Add a positional index if the element has previous siblings or next siblings of the same tag
    const nth =
      nbOfPreviousSiblings || hasNextSiblings
        ? `[${nbOfPreviousSiblings + 1}]` // Use 1-based index in XPath
        : '';

    // Push the current element's tag name and optional index into the parts array
    parts.push(prefix + nodeElem.localName + nth);

    // Move up to the parent element
    nodeElem = nodeElem.parentElement;
  }

  // If we have any parts collected, join them into a full XPath expression
  return parts.length ? `/${parts.reverse().join('/')}` : '';
}
