---
title: 🔍 Lookup and Manage Documents
sidebar_position: 4
---

Once your `DocumentStore` is initialized and populated, you can fetch, list, and manage documents within it.

### Listing and Fetching Documents

The simplest way to render the documents in the store is to use the **`CardCarousel`** composable from `multipaz-compose`. It is backed by a **`DocumentModel`**, which observes the `DocumentStore` reactively — once you create the model from your store and document type repository, the carousel updates automatically as documents are added or removed (e.g. after a successful provisioning flow), so you don't need to manually re-fetch and diff a list yourself.

If you do need direct access to the documents (for non-UI logic), `DocumentStore#listDocuments` still returns them.

**Example: Listing Documents**

1: **Define the `listDocuments` function**

The `listDocuments` function is part of the `AppContainer` interface and implemented in `AppContainerImpl` (in the `core` module):

```kotlin
// core/src/commonMain/kotlin/.../core/AppContainer.kt
interface AppContainer {
    
    suspend fun listDocuments(): MutableList<Document>

    // ... rest of the implementations
}
```

Refer to **[this AppContainer code](https://github.com/openwallet-foundation/multipaz-samples/blob/e18a008b9fcb53ee27932470cfa18800df3b2c10/MultipazGettingStartedSample/core/src/commonMain/kotlin/org/multipaz/getstarted/core/AppContainer.kt#L34)** for the complete example.

```kotlin
// core/src/commonMain/kotlin/.../core/AppContainerImpl.kt
class AppContainerImpl : AppContainer {
    // ...
    override suspend fun listDocuments(): MutableList<Document> {
        val documents = mutableStateListOf<Document>()
        for (document in documentStore.listDocuments()) {
            if (!documents.contains(document)) {
                documents.add(document)
            }
        }
        return documents
    }
}
```

Refer to **[this listDocuments code](https://github.com/openwallet-foundation/multipaz-samples/blob/e18a008b9fcb53ee27932470cfa18800df3b2c10/MultipazGettingStartedSample/core/src/commonMain/kotlin/org/multipaz/getstarted/core/AppContainerImpl.kt#L290-L298)** for the complete example.

2: **Render the documents in a `DocumentSection` within `HomeScreen`**

`HomeScreen` is laid out as a `Scaffold` with a top app bar and a vertically scrolling `Column` that stacks the screen's sections. Each section is a self-contained composable — the first is the **document section**, which lists the credentials in the store; the presentment and identity-verification sections are added in later guides.

Inside `DocumentSection` we build a `DocumentModel` from `container.documentStore` and `container.documentTypeRepository` (the latter is wired up alongside the document store — see [Setting Up the DocumentStore](01-storage.md)) and feed its `documentInfos` flow to `CardCarousel`. We use `produceState` so model creation runs as a suspend block tied to the composition, and `collectAsState()` on the model's `documentInfos` to drive the carousel reactively.

```kotlin
@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun HomeScreen(
    container: AppContainer,
    // ...
) {
    Scaffold(
        topBar = {
            CenterAlignedTopAppBar(title = { Text("Multipaz Getting Started") })
        }
    ) { innerPadding ->
        Column(
            modifier = Modifier
                .fillMaxSize()
                .padding(innerPadding)
                .verticalScroll(rememberScrollState())
                .padding(horizontal = 16.dp, vertical = 8.dp),
            verticalArrangement = Arrangement.spacedBy(16.dp),
        ) {
            DocumentSection(container = container)
        }
    }
}

@OptIn(ExperimentalMaterial3Api::class)
@Composable
private fun DocumentSection(
    container: AppContainer,
) {
    SectionCard(
        title = "Your wallet",
        subtitle = "The credentials currently stored on this device.",
    ) {
        val documentModel by produceState<DocumentModel?>(null, container) {
            value = DocumentModel.create(
                documentStore = container.documentStore,
                documentTypeRepository = container.documentTypeRepository,
            )
        }

        var selectedDocumentId by rememberSaveable { mutableStateOf<String?>(null) }

        val model = documentModel
        if (model == null) {
            LoadingRow("Loading documents…")
        } else {
            val documentInfos by model.documentInfos.collectAsState()

            CardCarousel(
                cardInfos = documentInfos,
                onCardClicked = { selectedDocumentId = it.identifier },
            )

            selectedDocumentId?.let { id ->
                ModalBottomSheet(onDismissRequest = { selectedDocumentId = null }) {
                    DocumentDetails(
                        documentModel = model,
                        documentStore = container.documentStore,
                        documentId = id,
                        onDocumentDeleted = { selectedDocumentId = null },
                    )
                }
            }
        }
    }
}
```

Refer to **[this `HomeScreen` and `DocumentSection` code](https://github.com/openwallet-foundation/multipaz-samples/blob/e18a008b9fcb53ee27932470cfa18800df3b2c10/MultipazGettingStartedSample/composeApp/src/commonMain/kotlin/org/multipaz/getstarted/HomeScreen.kt#L72-L223)** for the complete example.

Each section is wrapped in a small `SectionCard` — a titled `ElevatedCard` — and slow-loading content shows a `LoadingRow` while it resolves. Both are shared helpers reused by the presentment and identity-verification sections in the later guides:

```kotlin
/** A titled, elevated container used to group related actions on the home screen. */
@Composable
private fun SectionCard(
    title: String,
    subtitle: String? = null,
    content: @Composable ColumnScope.() -> Unit,
) {
    ElevatedCard(modifier = Modifier.fillMaxWidth()) {
        Column(
            modifier = Modifier.fillMaxWidth().padding(16.dp),
            verticalArrangement = Arrangement.spacedBy(12.dp),
        ) {
            Text(text = title, style = MaterialTheme.typography.titleMedium)
            subtitle?.let {
                Text(
                    text = it,
                    style = MaterialTheme.typography.bodySmall,
                    color = MaterialTheme.colorScheme.onSurfaceVariant,
                )
            }
            content()
        }
    }
}

@Composable
private fun LoadingRow(label: String) {
    Row(
        modifier = Modifier.fillMaxWidth().padding(vertical = 8.dp),
        horizontalArrangement = Arrangement.Center,
        verticalAlignment = Alignment.CenterVertically,
    ) {
        CircularProgressIndicator(modifier = Modifier.height(20.dp).width(20.dp))
        Spacer(Modifier.width(12.dp))
        Text(text = label, style = MaterialTheme.typography.bodyMedium)
    }
}
```

Refer to **[these `SectionCard` and `LoadingRow` helpers](https://github.com/openwallet-foundation/multipaz-samples/blob/e18a008b9fcb53ee27932470cfa18800df3b2c10/MultipazGettingStartedSample/composeApp/src/commonMain/kotlin/org/multipaz/getstarted/HomeScreen.kt#L349-L385)** for the complete example.

A few notes on the snippet:

* `HomeScreen` composes the screen from independent section composables — `DocumentSection` here, plus `PresentmentSection` and `FaceMatchSection` added in later guides — stacked inside a single scrolling `Column`.
* Building the `DocumentModel` is a suspend operation, so `documentModel` is `null` on the first composition. While it resolves we show a small `LoadingRow` (a `CircularProgressIndicator` next to a label) and swap in the carousel once the model is ready.
* `CardCarousel` renders each entry from the `documentInfos` list as a card art tile and exposes an `onCardClicked` callback that receives the `DocumentInfo` for the tapped card — its `identifier` matches the underlying `Document`'s identifier.
* `selectedDocumentId` is held with `rememberSaveable` so the selection survives configuration changes (e.g. rotation), and surfaces a `ModalBottomSheet` that hosts the `DocumentDetails` composable defined in the next section.

### Showing Document Details and Deleting

Tapping a card in the carousel opens a `ModalBottomSheet` hosting a `DocumentDetails` composable. It displays the document's card art, type, name, and provisioning status, and exposes a delete button. We prevent deletion of the default sample document so the store is never empty.

```kotlin
@Composable
private fun DocumentDetails(
    documentModel: DocumentModel,
    documentStore: DocumentStore,
    documentId: String,
    onDocumentDeleted: () -> Unit,
) {
    val coroutineScope = rememberCoroutineScope()
    val documentInfo = documentModel.documentInfos.collectAsState().value
        .find { it.document.identifier == documentId }

    if (documentInfo == null) {
        Text("No document for identifier $documentId")
        return
    }
    val document = documentInfo.document

    Column(
        modifier = Modifier.fillMaxWidth().padding(16.dp),
        horizontalAlignment = Alignment.CenterHorizontally,
        verticalArrangement = Arrangement.spacedBy(12.dp),
    ) {
        Image(
            modifier = Modifier.height(200.dp),
            contentScale = ContentScale.FillHeight,
            bitmap = documentInfo.cardArt,
            contentDescription = null,
        )
        Text(
            text = document.typeDisplayName ?: "(typeDisplayName not set)",
            style = MaterialTheme.typography.bodyMedium,
            color = MaterialTheme.colorScheme.secondary,
        )

        KeyValuePair("Provisioned", if (document.provisioned) "Yes" else "No")
        KeyValuePair("Document Type", document.typeDisplayName ?: "(typeDisplayName not set)")
        KeyValuePair("Document Name", document.displayName ?: "(displayName not set)")

        if (document.displayName != CredentialDomains.SAMPLE_DOCUMENT_DISPLAY_NAME)
            Button(
                onClick = {
                    coroutineScope.launch { documentStore.deleteDocument(documentId) }
                    onDocumentDeleted()
                },
                colors = ButtonDefaults.buttonColors(
                    containerColor = Color.Red,
                    contentColor = Color.White,
                ),
            ) {
                Text("Delete document")
            }
    }
}

@Composable
private fun KeyValuePair(key: String, value: String) {
    Row(
        modifier = Modifier.fillMaxWidth(),
        horizontalArrangement = Arrangement.SpaceBetween,
    ) {
        Text(text = key, fontWeight = FontWeight.Bold)
        Text(text = value)
    }
}
```

Key things to note:

* `documentModel.documentInfos` is a `StateFlow<List<DocumentInfo>>`, so `collectAsState()` keeps the bottom sheet content live — if the document is deleted from another code path, the lookup will return `null` and you fall through to the empty branch.
* `DocumentStore#deleteDocument(identifier: String)` is the underlying API for removal; on success the carousel auto-refreshes via `DocumentModel`.
* Calling `onDocumentDeleted()` clears `selectedDocumentId` in the parent so the bottom sheet dismisses.

Refer to **[this code from `HomeScreen.kt`](https://github.com/openwallet-foundation/multipaz-samples/blob/e18a008b9fcb53ee27932470cfa18800df3b2c10/MultipazGettingStartedSample/composeApp/src/commonMain/kotlin/org/multipaz/getstarted/HomeScreen.kt#L387-L450)** for the complete example.

By following these steps, the document list, detail view, and deletion flow stay consistent with the underlying `DocumentStore` automatically — no manual list maintenance required.
