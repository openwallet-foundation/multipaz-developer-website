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

2: **Implement the UI for listing documents in `HomeScreen` Composable**

```kotlin
@Composable
fun HomeScreen(
    // ... other parameters
    documents: List<Document>, // add document list and deletion callbacks as a parameters
    onDeleteDocument: (Document) -> Unit,
) {
    val coroutineScope = rememberCoroutineScope { App.promptModel }

    Column {
        // ...

        if (documents.isNotEmpty()) {
            Text(
                modifier = Modifier.padding(4.dp),
                text = "${documents.size} Documents present:"
            )
            documents.forEachIndexed { index, document ->
                Row(verticalAlignment = Alignment.CenterVertically) {
                    Text(
                        text = document.metadata.displayName ?: document.identifier,
                        modifier = Modifier.padding(4.dp)
                    )
                    // delete button here (explained in next step)
                }
            }
        } else {
            Text(text = "No documents found.")
        }
    }
}
```

3: **Update App.kt on `HomeScreen` invocation**

```kotlin
class App {
    @Composable
    fun Content() {
        val documents = remember { mutableStateListOf<Document>() }

        LaunchedEffect(navController.currentDestination) {
            val currentDocuments = listDocuments()
            if (currentDocuments.size != documents.size) {
                documents.apply {
                    clear()
                    addAll(currentDocuments)
                }
            }
        }

        // ...

        MaterialTheme {
            Column {
                NavHost {
                    composable<Destination.HomeDestination> {
                        HomeScreen(
                            app = this@App,
                            navController = navController,
                            documents = documents,
                            onDeleteDocument = {
                                documents.remove(it)
                            },
                        )
                    }
                }
            }
        }
    }
}

```

### Deleting Documents

To remove a document from the `DocumentStore`, use the `DocumentStore#deleteDocument(identifier: String)` method and provide the document's identifier.

**Example: Deleting a Document**

You can add the following code to `HomeScreen` Composable to add a small delete button to the listing we implemented above. We use a simple `IconButton` with the default delete icon. We prevent deletion of the default document to ensure the document store is never empty.

```kotlin
// delete button here (explained in next step)
if (document.metadata.displayName != SAMPLE_DOCUMENT_DISPLAY_NAME) {
    IconButton(
        content = @Composable {
            Icon(
                imageVector = Icons.Default.Delete,
                contentDescription = null
            )
        },
        onClick = {
            coroutineScope.launch {
                app.documentStore.deleteDocument(document.identifier)
                onDeleteDocument(document)
            }
        }
    )
}
```

Refer to **[this code from `HomeScreen.kt`](https://github.com/openwallet-foundation/multipaz-samples/blob/5143fd7e31e7c61bebffd38b6e496c0cde855d1f/MultipazGettingStartedSample/composeApp/src/commonMain/kotlin/org/multipaz/getstarted/HomeScreen.kt#L166-L198)** and [**from `App.kt`**](https://github.com/openwallet-foundation/multipaz-samples/blob/5143fd7e31e7c61bebffd38b6e496c0cde855d1f/MultipazGettingStartedSample/composeApp/src/commonMain/kotlin/org/multipaz/getstarted/App.kt#L350-L360) for the complete example.

By following these steps, you can efficiently list, fetch, and delete documents managed by your `DocumentStore`, ensuring your application's document management remains clean and up-to-date.
