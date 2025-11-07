---
title: 🔍 Lookup and Manage Documents
sidebar_position: 4
---

Once your `DocumentStore` is initialized and populated, you can fetch, list, and manage documents within it.

### Listing and Fetching Documents

You can retrieve all documents stored in the `DocumentStore` using `DocumentStore#listDocuments`. For each document ID retrieved, use `DocumentStore#lookupDocument` to get the corresponding document object.

**Example: Listing Documents**

1: **Define the `listDocuments` function**

```kotlin
class App {
    suspend fun listDocuments(): MutableList<Document> {
        val documents = mutableStateListOf<Document>()
        for (documentId in documentStore.listDocuments()) {
            documentStore.lookupDocument(documentId)?.let { document ->
                if (!documents.contains(document)) {
                    documents.add(document)
                }
            }
        }
        return documents
    }
}
```

2: **Implement the UI for listing documents**

```kotlin
class App {
    fun Content() {
        MaterialTheme {
            Column {
                // ...

                var documents = remember { mutableStateListOf<Document>() }

                LaunchedEffect(isInitialized.value, documents) {
                    if (isInitialized.value) {
                        documents.addAll(listDocuments())
                    }
                }

                if (documents.isNotEmpty()) {
                    Text(
                        modifier = Modifier.padding(4.dp),
                        text = "${documents.size} Documents present:"
                    )
                    for (document in documents) {
                        Row(verticalAlignment = Alignment.CenterVertically) {
                            Text(
                                text = document.metadata.displayName ?: document.identifier,
                                modifier = Modifier.padding(4.dp)
                            )
                            // delete button from the next step goes here
                        }
                    }
                } else {
                    Text(text = "No documents found.")
                }
            }
        }
    }
}
```

### Deleting Documents

To remove a document from the `DocumentStore`, use the `DocumentStore#deleteDocument(identifier: String)` method and provide the document's identifier.

**Example: Deleting a Document**

You can add the following code to add a small delete button to the listing we implemented above. We use a simple `IconButton` with the default delete icon.

```kotlin
IconButton(
    content = @Composable {
        Icon(
            imageVector = Icons.Default.Delete,
            contentDescription = null
        )
    },
    onClick = {
        coroutineScope.launch {
            documentStore.deleteDocument(document.identifier)
            documents.remove(document)
        }
    }
)
```

Refer to **[this Document Listing & Deletion code](https://github.com/openwallet-foundation/multipaz-samples/blob/9ef4472490e8c497f492f94763418afc7cdf5545/MultipazGettingStartedSample/composeApp/src/commonMain/kotlin/org/multipaz/getstarted/App.kt#L430-L467)** for the complete example.

By following these steps, you can efficiently list, fetch, and delete documents managed by your `DocumentStore`, ensuring your application's document management remains clean and up-to-date.
