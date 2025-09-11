/**
 * ======================================================================
 * Dewey.ai Knowledge Query Function
 * ======================================================================
 * This self-contained function allows you to query the knowledge base
 * created by your Dewey.ai application.
 *
 * How to use:
 * 1. Save this code as a .js or .ts file in your project.
 * 2. Import and call the 'queryLibrary' function.
 * 3. This function operates on a static snapshot of the library data.
 *    To update, re-download this snippet from the Dewey.ai app.
 *
 * Example Usage:
 * 
 * const resultsByKeyword = await queryLibrary({ keyword: 'algebra' });
 * console.log(resultsByKeyword); 
 * // -> [{ title: '...', summary: '...', ... }]
 * 
 * const resultsByDDC = await queryLibrary({ ddc: '512' });
 * console.log(resultsByDDC);
 * // -> [{ title: '...', summary: '...', ... }]
 * 
 * To deploy on Vercel:
 * 1. Create an 'api' directory in your project.
 * 2. Save this file as 'api/query.js'.
 * 3. Your endpoint will be accessible at '/api/query'.
 * 4. The function below is pre-configured to handle Vercel serverless requests.
 */

const libraryData = {
  "id": "root",
  "name": "Library",
  "children": [
    {
      "id": "000",
      "name": "000 - Computer science, information, general works",
      "children": [],
      "books": [],
      "config": {
        "@context": {
          "schema": "http://schema.org/",
          "dc": "http://purl.org/dc/terms/",
          "dewey": "http://purl.org/NET/decimalised#"
        },
        "@id": "urn:library:class:000",
        "@type": "schema:CollectionPage",
        "name": "Computer science, information, general works",
        "dewey:notation": "000"
      }
    },
    {
      "id": "100",
      "name": "100 - Philosophy, parapsychology and occultism, psychology",
      "children": [],
      "books": [],
      "config": {
        "@context": {
          "schema": "http://schema.org/",
          "dc": "http://purl.org/dc/terms/",
          "dewey": "http://purl.org/NET/decimalised#"
        },
        "@id": "urn:library:class:100",
        "@type": "schema:CollectionPage",
        "name": "Philosophy, parapsychology and occultism, psychology",
        "dewey:notation": "100"
      }
    },
    {
      "id": "200",
      "name": "200 - Religion",
      "children": [],
      "books": [],
      "config": {
        "@context": {
          "schema": "http://schema.org/",
          "dc": "http://purl.org/dc/terms/",
          "dewey": "http://purl.org/NET/decimalised#"
        },
        "@id": "urn:library:class:200",
        "@type": "schema:CollectionPage",
        "name": "Religion",
        "dewey:notation": "200",
        "schema:description": "Beliefs, attitudes, practices of individuals and groups with respect to the ultimate nature of existences and relationships within the context of revelation, deity, worship Including public relations for religion Class here comparative religion; religions other than Christianity; works dealing with various religions, with religious topics not applied to specific religions; syncretistic religious writings of individuals expressing personal views and not claiming to establish a new religion or to represent an old one"
      }
    },
    {
      "id": "300",
      "name": "300 - Social sciences",
      "children": [],
      "books": [],
      "config": {
        "@context": {
          "schema": "http://schema.org/",
          "dc": "http://purl.org/dc/terms/",
          "dewey": "http://purl.org/NET/decimalised#"
        },
        "@id": "urn:library:class:300",
        "@type": "schema:CollectionPage",
        "name": "Social sciences",
        "dewey:notation": "300",
        "schema:description": "Class here behavioral sciences, social studies"
      }
    },
    {
      "id": "400",
      "name": "400 - Language",
      "children": [],
      "books": [],
      "config": {
        "@context": {
          "schema": "http://schema.org/",
          "dc": "http://purl.org/dc/terms/",
          "dewey": "http://purl.org/NET/decimalised#"
        },
        "@id": "urn:library:class:400",
        "@type": "schema:CollectionPage",
        "name": "Language",
        "dewey:notation": "400",
        "schema:description": "Class here interdisciplinary works on language and literature"
      }
    },
    {
      "id": "500",
      "name": "500 - Natural sciences and mathematics",
      "children": [],
      "books": [],
      "config": {
        "@context": {
          "schema": "http://schema.org/",
          "dc": "http://purl.org/dc/terms/",
          "dewey": "http://purl.org/NET/decimalised#"
        },
        "@id": "urn:library:class:500",
        "@type": "schema:CollectionPage",
        "name": "Natural sciences and mathematics",
        "dewey:notation": "500",
        "schema:description": "Natural sciences: sciences that deal with matter and energy, or with objects and processes observable in nature Class here interdisciplinary works on natural and applied sciences"
      }
    },
    {
      "id": "600",
      "name": "600 - Technology (Applied sciences)",
      "children": [],
      "books": [],
      "config": {
        "@context": {
          "schema": "http://schema.org/",
          "dc": "http://purl.org/dc/terms/",
          "dewey": "http://purl.org/NET/decimalised#"
        },
        "@id": "urn:library:class:600",
        "@type": "schema:CollectionPage",
        "name": "Technology (Applied sciences)",
        "dewey:notation": "600",
        "schema:description": "Class here inventions"
      }
    },
    {
      "id": "700",
      "name": "700 - The arts",
      "children": [],
      "books": [],
      "config": {
        "@context": {
          "schema": "http://schema.org/",
          "dc": "http://purl.org/dc/terms/",
          "dewey": "http://purl.org/NET/decimalised#"
        },
        "@id": "urn:library:class:700",
        "@type": "schema:CollectionPage",
        "name": "The arts",
        "dewey:notation": "700",
        "schema:description": "Description, critical appraisal, techniques, procedures, apparatus, equipment, materials of the fine, decorative, performing, recreational, literary arts Class here conceptual art, fine and decorative arts, government policy on the arts, plastic arts (visual arts), visual arts"
      }
    },
    {
      "id": "800",
      "name": "800 - Literature (Belles-lettres) and rhetoric",
      "children": [],
      "books": [],
      "config": {
        "@context": {
          "schema": "http://schema.org/",
          "dc": "http://purl.org/dc/terms/",
          "dewey": "http://purl.org/NET/decimalised#"
        },
        "@id": "urn:library:class:800",
        "@type": "schema:CollectionPage",
        "name": "Literature (Belles-lettres) and rhetoric",
        "dewey:notation": "800",
        "schema:description": "Class here works of literature, works about literature"
      }
    },
    {
      "id": "900",
      "name": "900 - History, geography, and auxiliary disciplines",
      "children": [],
      "books": [],
      "config": {
        "@context": {
          "schema": "http://schema.org/",
          "dc": "http://purl.org/dc/terms/",
          "dewey": "http://purl.org/NET/decimalised#"
        },
        "@id": "urn:library:class:900",
        "@type": "schema:CollectionPage",
        "name": "History, geography, and auxiliary disciplines",
        "dewey:notation": "900",
        "schema:description": "Class here social situations and conditions; general political history; military, diplomatic, political, economic, social, welfare aspects of specific wars"
      }
    }
  ],
  "books": [],
  "config": {
    "@context": {
      "schema": "http://schema.org/"
    },
    "@id": "urn:library:root",
    "@type": "schema:Library",
    "name": "Dewey.ai Knowledge Library"
  }
};

// Helper function to recursively search for books
function searchNode(node, predicate, results) {
  // Check books in the current node
  node.books.forEach(book => {
    if (predicate(book)) {
      // Avoid duplicates
      if (!results.some(r => r.id === book.id)) {
        results.push(book);
      }
    }
  });

  // Recurse into children
  node.children.forEach(child => searchNode(child, predicate, results));
}

/**
 * Queries the library knowledge base.
 * @param {object} params - The query parameters.
 * @param {string} [params.keyword] - A keyword to search for in book titles, summaries, and keywords.
 * @param {string} [params.ddc] - A Dewey Decimal number to search for. Matches if the book's DDC starts with this number.
 * @returns {Promise<object[]>} A promise that resolves to an array of matching book objects.
 */
export async function queryLibrary({ keyword, ddc }) {
  const results = [];
  let predicate = () => false;
  const normalizedKeyword = keyword ? keyword.toLowerCase() : '';

  if (keyword) {
    predicate = (book) => 
      book.title.toLowerCase().includes(normalizedKeyword) ||
      book.summary.toLowerCase().includes(normalizedKeyword) ||
      book.keywords.some(kw => kw.toLowerCase().includes(normalizedKeyword));
  } else if (ddc) {
    predicate = (book) => book.ddc.number.startsWith(ddc);
  } else {
    return []; // No valid query parameter
  }
  
  searchNode(libraryData, predicate, results);
  return results;
}


/**
 * Vercel Serverless Function Handler (optional)
 * This handler exposes the queryLibrary function as an API endpoint.
 * It expects a GET request with 'keyword' or 'ddc' query parameters.
 * e.g., /api/query?keyword=science
 */
export default async function handler(req, res) {
  const { keyword, ddc } = req.query;

  if (!keyword && !ddc) {
    res.status(400).json({ error: 'Please provide a "keyword" or "ddc" query parameter.' });
    return;
  }

  try {
    const results = await queryLibrary({ keyword, ddc });
    res.status(200).json(results);
  } catch (error) {
    res.status(500).json({ error: 'An error occurred while querying the library.' });
  }
}