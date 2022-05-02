# CFDE/GTEx Gene Expression Browser Prototype

# CFDE knowledge base iframe endpoints


## GeneTissues

![gene_tissues](../blob/main/doc/images/GeneTissues-basic.png?raw=true)

Endpoint: /gene_tissues

Parameters:

 - gencodeId: Ensembl id (e.g,. "ENSG00000000003") for the gene for which to display expression data. (required)
 - width: Width in pixels of the containing iframe. (required)
 - height: Height in pixels of the containing iframe. (required)
 - numTopTissues: Number of top tissues to display (default = 10)
 - hideTitle: 0 or 1. Whether to hide the title bar at the top of the widget. (default = 0)
 - uberonIds: Comma-delimited list of ids from the Uberon multi-species anatomy ontology (e.g,. "UBERON:0002037,UBERON:0002369")
 - tissueSiteDetailIds: Comma-delimited list of GTEx tissueSiteDetailIds. (e.g., "Liver,Lung")


## Anatomy

Endpoint: /anatomy

Parameters:

 - uberonIds:
 - width:
 - height:
 - numTopGenes:


## AnatomyMultiSource

Endpoint: /anatomy_multi

Parameters:

 - uberonIds:
 - width:
 - height:
 - numTopGenes:


> A Vue.js project

For a detailed explanation on how things work, check out the [guide](http://vuejs-templates.github.io/webpack/) and [docs for vue-loader](http://vuejs.github.io/vue-loader).

## Build Setup

``` bash
# install dependencies
npm install

# serve with hot reload at localhost:8080
npm run dev

# build for production with minification
npm run build

# build for production and view the bundle analyzer report
npm run build --report

# run unit tests
npm run unit

# run e2e tests
npm run e2e

# run all tests
npm test
```
