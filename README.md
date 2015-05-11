bibliographies
==============

This project is a web application that wraps the bibutils binaries.  The API is based on the `Content-Type` and `Accept` header:

Examples:

* Send bibtex, get back XML
* Send endnote, get XML
* Send RSI, get back endnote

### Usage

Convert bibtex to RIS:

```
curl -i -X POST --data-binary @./test.bib -H "Accept: application/x-Research-Info-Systems" -H "Content-Type: application/x-bibtex" http://springer-hackday-bibutils.herokuapp.com/convert
```

Change the `Accept` header to get a different format.  The formats are in `formats.json`.
