## Bibliographies

Example usage:

```
curl -i -X POST --data-binary @/Users/alex/Desktop/archive.json -H "Accept: application/x-bibtex" -H "Content-Type: application/papers+json" http://localhost:3001/convert
```

Given an array of papermill publications (see `sample-data/`).
