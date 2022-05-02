# CFDE/GTEx Gene Expression Browser Prototype

# CFDE knowledge base iframe endpoints


## GeneTissues

![gene_tissues](../main/doc/images/GeneTissues-basic.png?raw=true)

Endpoint: /gene_tissues

Parameters:

 - gencodeId: Ensembl id (e.g,. "ENSG00000000003") for the gene for which to display expression data. (required)
 - width: Width in pixels of the containing iframe. (required)
 - height: Height in pixels of the containing iframe. (required)
 - numTopTissues: Number of top tissues to display (default = 10)
 - hideTitle: 0 or 1. Whether to hide the title bar at the top of the widget. (default = 0)
 - uberonIds: Comma-delimited list of ids from the Uberon multi-species anatomy ontology (e.g,. "UBERON:0002037,UBERON:0002369")
 - tissueSiteDetailIds: Comma-delimited list of GTEx tissueSiteDetailIds. (e.g., "Liver,Lung")

### Examples

1. Basic usage. gencodeId, width, and height are all required:

   ![Basic gene_tissues iframe without gencode version](../main/doc/images/GeneTissues-basic.png?raw=true)

```
<iframe style='width: 1200px; height: 450px; border: 1px solid black;' src='https://your_host_here/gene_tissues?gencode_id=ENSG00000000003&width=1200&height=450'></iframe>
```

2. The version component of the gencodeId is optional:

   ![gene_tissues iframe with gencode version](../main/doc/images/GeneTissues-with-gencode-ver.png?raw=true)

```
<iframe style='width: 1200px; height: 450px; border: 1px solid black;' src='https://your_host_here/gene_tissues?gencode_id=ENSG00000000003.14&width=1200&height=450'></iframe>
```

3. Changing numTopTissues from the default of 10 to 15:

   ![gene_tissues iframe with gencode version](../main/doc/images/GeneTissues-15-top-tissues.png?raw=true)

```
<iframe style='width: 1200px; height: 450px; border: 1px solid black;' src='http://localhost:8080/gene_tissues?gencode_id=ENSG00000000003.14&width=1200&height=450&numTopTissues=15'></iframe>
```
  
4. Setting hideTitle=1 to suppress the title at the top:

   ![gene_tissues iframe with gencode version](../main/doc/images/GeneTissues-hide-title.png?raw=true)

```
<iframe style='width: 1200px; height: 450px; border: 1px solid black;' src='http://localhost:8080/gene_tissues?gencode_id=ENSG00000000003.14&width=1200&height=450&hideTitle=1'></iframe>
```  

5. Using tissueSiteDetailIds to initialize the iframe with a comparison of Liver and Lung, instead of the top 10 tissues:

   ![gene_tissues iframe with gencode version](../main/doc/images/GeneTissues-liver-lung.png?raw=true)

```
<iframe style='width: 1200px; height: 450px; border: 1px solid black;' src='http://localhost:8080/gene_tissues?gencode_id=ENSG00000000003.14&width=1200&height=450&tissueSiteDetailIds=Liver,Lung'></iframe>
```

6. Using tissueSiteDetailIds and uberonIds to compare Liver, Lung, and Adrenal Gland (UBERON:0002369):

   ![gene_tissues iframe with gencode version](../main/doc/images/GeneTissues-liver-lung-uberon.png?raw=true)

```
<iframe style='width: 1200px; height: 450px; border: 1px solid black;' src='http://localhost:8080/gene_tissues?gencode_id=ENSG00000000003.14&width=1200&height=450&tissueSiteDetailIds=Liver,Lung&uberonIds=UBERON:0002369'></iframe>
```

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
