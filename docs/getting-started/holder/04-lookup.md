---
title: 🔍 Lookup and Manage Documents
sidebar_position: 4
---

Once your `DocumentStore` is initialized and populated, you can fetch, list, and manage documents within it.

### Listing and Fetching Documents

You can retrieve all documents stored in the `DocumentStore` using `DocumentStore#listDocuments`. For each document ID retrieved, use `DocumentStore#lookupDocument` to get the corresponding document object.

**Example: Listing Documents**

```kotlin
val documents = mutableStateListOf<Document>()
for (documentId in documentStore.listDocuments()) {
    documentStore.lookupDocument(documentId).let { document ->
        if (document != null && !documents.contains(document))
            documents.add(document)
    }
}
```

### Deleting Documents

To remove a document from the `DocumentStore`, use the `DocumentStore#deleteDocument` method and provide the document's identifier.

**Example: Deleting a Document**

```kotlin
documentStore.deleteDocument(document.identifier)
```

By following these steps, you can efficiently list, fetch, and delete documents managed by your `DocumentStore`, ensuring your application's document management remains clean and up-to-date.
