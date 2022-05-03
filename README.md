# CFDE/GTEx Gene Expression Browser Prototype

# Knowledge Base iframe endpoints

The expression browser is integrated with Deriva through the Knowledge Base, a Markdown-based facility that allows
arbitrary content to be associated with controlled vocabulary terms (e.g., genes and anatomical sites.)
To facilitate this integration the expression browser provides URLs/endpoints suitable for inclusion within an
HTML `<iframe>` in the Knowledge base Markdown. The main iframe endpoints, intended to be used in the Markdown
for genes and anatomical sites, respectively, are:

- [GeneTissues](#genetissues)
- [Anatomy](#anatomy)
- [AnatomyMultiSource](#anatomymultisource)


## GeneTissues

In the following screenshot the GeneTissues iframe endpoint displays expression data for ENSG00000000003/TSPAN6
(tetraspanin 6), using the Broad Institute's [GTEx-Viz](https://github.com/broadinstitute/gtex-viz) violin plot
and the GTEx Portal's [public API](https://gtexportal.org/home/api-docs/index.html):

![gene_tissues](../main/doc/images/GeneTissues-basic.png?raw=true)

### Endpoint: `/gene_tissues`

### Parameters:

 - `gencodeId`: Ensembl id (e.g,. "ENSG00000000003") of the gene for which to display expression data. (required)
 - `width`: Width in pixels of the containing iframe. (required)
 - `height`: Height in pixels of the containing iframe. (required)
 - `numTopTissues`: Number of top tissues to display (default = 10)
 - `hideTitle`: 0 or 1. Whether to hide the title bar at the top of the widget. (default = 0)
 - `uberonIds`: Comma-delimited list of ids from the Uberon multi-species anatomy ontology (e.g,. "UBERON:0002037,UBERON:0002369")
 - `tissueSiteDetailIds`: Comma-delimited list of GTEx tissueSiteDetailIds. (e.g., "Liver,Lung")

### Usage examples

1. Basic usage. `gencodeId`, `width`, and `height` are all required parameters:

   `/gene_tissues?gencode_id=ENSG00000000003&width=1200&height=450`
   
   ![Basic gene_tissues iframe without gencode version](../main/doc/images/GeneTissues-basic.png?raw=true)

   `<iframe style='width: 1200px; height: 450px; border: 1px solid black;' src='https://<hostname>/gene_tissues?gencode_id=ENSG00000000003&width=1200&height=450'></iframe>`

2. The version component of the `gencodeId` is optional but may be supplied:

   `gene_tissues?gencode_id=ENSG00000000003.14&width=1200&height=450`

   ![gene_tissues iframe with gencode version](../main/doc/images/GeneTissues-with-gencode-ver.png?raw=true)

   `<iframe style='width: 1200px; height: 450px; border: 1px solid black;' src='https://<hostname>/gene_tissues?gencode_id=ENSG00000000003.14&width=1200&height=450'></iframe>`

3. Change `numTopTissues` from the default of 10 to 15:

   `gene_tissues?gencode_id=ENSG00000000003.14&width=1200&height=450&numTopTissues=15`

   ![gene_tissues iframe with 15 top tissues](../main/doc/images/GeneTissues-15-top-tissues.png?raw=true)

   `<iframe style='width: 1200px; height: 450px; border: 1px solid black;' src='https://<hostname>/gene_tissues?gencode_id=ENSG00000000003.14&width=1200&height=450&numTopTissues=15'></iframe>`
  
4. Set `hideTitle=1` to suppress the title bar at the top:

   `gene_tissues?gencode_id=ENSG00000000003.14&width=1200&height=450&hideTitle=1`

   ![gene_tissues iframe with no title bar](../main/doc/images/GeneTissues-hide-title.png?raw=true)

   `<iframe style='width: 1200px; height: 450px; border: 1px solid black;' src='https://<hostname>/gene_tissues?gencode_id=ENSG00000000003.14&width=1200&height=450&hideTitle=1'></iframe>`  

5. Use `tissueSiteDetailIds` to initialize the iframe with a comparison of Liver and Lung, instead of the top 10 tissues. Note that
anatomical sites are color-coded and the numbers indicate the ranking of each anatomical site for this particular gene (i.e., 25 =
anatomical site with the 25th highest median TPM value):

   `gene_tissues?gencode_id=ENSG00000000003.14&width=1200&height=450&tissueSiteDetailIds=Liver,Lung`

   ![gene_tissues iframe with tissueSiteDetailIds set](../main/doc/images/GeneTissues-liver-lung.png?raw=true)

   `<iframe style='width: 1200px; height: 450px; border: 1px solid black;' src='https://<hostname>/gene_tissues?gencode_id=ENSG00000000003.14&width=1200&height=450&tissueSiteDetailIds=Liver,Lung'></iframe>`

6. Use `tissueSiteDetailIds` and `uberonIds` to compare Liver, Lung, and Adrenal Gland (referenced via UBERON:0002369):

   `gene_tissues?gencode_id=ENSG00000000003.14&width=1200&height=450&tissueSiteDetailIds=Liver,Lung&uberonIds=UBERON:0002369`

   ![gene_tissues iframe with tissueSiteDetailIds and uberonIds set](../main/doc/images/GeneTissues-liver-lung-uberon.png?raw=true)

   `<iframe style='width: 1200px; height: 450px; border: 1px solid black;' src='https://<hostname>/gene_tissues?gencode_id=ENSG00000000003.14&width=1200&height=450&tissueSiteDetailIds=Liver,Lung&uberonIds=UBERON:0002369'></iframe>`

### Interactive features

 - Click on "Specific site(s) only" to select anatomical sites for comparison instead of displaying the top N:
 
   ![gene_tissues iframe showing specific sites instead of top 10](../main/doc/images/GeneTissues-specific-sites.png)

 - Enter a term (e.g., "brain") to search for anatomical sites:
 
   ![gene_tissues iframe search for anatomical terms matching 'brain'](../main/doc/images/GeneTissues-search-brain.png)

 - Hover over an anatomical site to see the full description:
 
   ![gene_tissues iframe hover over anatomical term to see full description](../main/doc/images/GeneTissues-tissue-hover.png)

 - Select "Log scale" to use a logarithmic scale for the violin plots:
 
   ![gene_tissues iframe log scale display](../main/doc/images/GeneTissues-log-scale.png)

 - Toggle the display of outliers with the "Show outliers" slider:
 
   ![gene_tissues iframe show or hide outliers](../main/doc/images/GeneTissues-no-outliers.png)

 - Select "Subset by sex" to compare expression between male and female subjects:
 
   ![gene_tissues iframe subset by sex](../main/doc/images/GeneTissues-subset-by-sex.png)

 - Hover over the violin plots to see the anatomical site and median TPM:
 
   ![gene_tissues iframe hover over violin plot](../main/doc/images/GeneTissues-violin-hover.png)


## Anatomy

In the following screenshot the Anatomy iframe endpoint displays the 25 most highly-expressed genes in
the adrenal gland (UBERON:0002369), excluding mitochondrial genes. 

![anatomy](../main/doc/images/Anatomy-basic.png?raw=true)

### Endpoint: `/anatomy`

### Parameters:

 - `uberonIds`:  Comma-delimited list of ids from the Uberon multi-species anatomy ontology (e.g,. "UBERON:0002037,UBERON:0002369")
 - `width`: Width in pixels of the containing iframe. (required)
 - `height`: Height in pixels of the containing iframe. (required)
 - `numTopGenes`: Number of top-expressed genes to display (default = 10)

### Usage examples

1. Basic usage. `uberonIds`, `width`, and `height` are all required parameters:

   `anatomy?uberon_ids=UBERON%3A0002369,UBERON%3A0002037&width=1400&height=550`
   
   ![Basic anatomy iframe](../main/doc/images/Anatomy-basic.png?raw=true)

   `<iframe style='width: 1400px; height: 550px; border: 1px solid black;' src='https://<hostname>/anatomy?uberon_ids=UBERON%3A0002369,UBERON%3A0002037&width=1400&height=550'></iframe>`

2. Change `numTopGenes` from the default of 10 to 25:

   `anatomy?uberon_ids=UBERON%3A0002369,UBERON%3A0002037&width=1400&height=550&numTopGenes=25`
   
   ![Anatomy iframe with 25 top genes](../main/doc/images/Anatomy-top-25-genes.png?raw=true)

   `<iframe style='width: 1400px; height: 550px; border: 1px solid black;' src='https://<hostname>/anatomy?uberon_ids=UBERON%3A0002369,UBERON%3A0002037&width=1400&height=550&numTopGenes=25'></iframe>`


### Interactive features

 - Toggle the inclusion of mitochondrial genes (in the top N expressed genes only) with the "Include mitochondrial genes" option:

 - Click on "Specific gene(s)" to select specific genes of interest for comparison instead of displaying the top N:

 - Add specific genes using a keyword search/partial match on gene name:

 - Add specific genes by cutting and pasting gencode ids into the provided textarea:

 - Click on "Add Anatomical Site(s)" to add/remove anatomical sites from the comparison:
 

## AnatomyMultiSource

### Endpoint: `/anatomy_multi`

### Parameters:

 - `uberonIds`:  Comma-delimited list of ids from the Uberon multi-species anatomy ontology (e.g,. "UBERON:0002037,UBERON:0002369")
 - `width`: Width in pixels of the containing iframe. (required)
 - `height`: Height in pixels of the containing iframe. (required)
 - `numTopGenes`: Number of top-expressed genes to display (default = 10)




## Build Setup

> A Vue.js project

For a detailed explanation on how things work, check out the [guide](http://vuejs-templates.github.io/webpack/) and [docs for vue-loader](http://vuejs.github.io/vue-loader).

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
