<template>
  <v-container
    fluid
    fill-width
    class="ma-0 pa-0">

    <v-row class="ma-0 pa-0">
      <v-col
        cols="12"
        class="ma-0 pa-0">
        <v-app-bar
          class="ma-0 pa-0"
          color="#336699">
          <v-toolbar-title class="text-h5 ma-0 pa-0 text-white"><img
            src="static/CFDE-icon-1.png"
            style="height: 2rem;"
            class="pr-2">CFDE/GTEx Gene Expression Browser</v-toolbar-title>
        </v-app-bar>
      </v-col>
    </v-row>

    <v-row class="ma-4 pa-0">
      <v-col
        cols="4"
        class="ma-0 pa-0">

        <h3>Gene Search</h3>
        <v-text-field
          v-model="gene_ss"
          label="Enter gene id e.g., MYLK, PTEN, BRCA"
          clearable
          clear-icon="mdi-close-circle"
          solo
          class="pt-2"
          @keyup.enter="searchClicked"
        />
        <v-btn
          :disabled="gene_ss == null || gene_ss == ''"
          @click="searchClicked">search</v-btn>
        <v-btn
          :disabled="gene_ss == null || gene_ss == ''"
          @click="resetAll">reset all</v-btn>

        <h4 class="mt-4 pt-2">Search results ({{ gene_ss_results.length }}):</h4>
        <v-list>
          <v-list-item-group v-model="sel_gene_index">
            <v-list-item
              v-for="(item, i) in gene_ss_results"
              :key="i">
              <v-list-item-avatar>
                <v-tooltip
                  v-if="item.geneType == 'protein coding'"
                  top>
                  <template v-slot:activator="{ on }"><v-chip
                    color="#61cc7e"
                    v-on="on">P</v-chip></template>
                  <span>protein coding gene</span>
                </v-tooltip>

                <v-tooltip
                  v-else-if="item.geneType.endsWith('unprocessed pseudogene')"
                  top>
                  <template v-slot:activator="{ on }"><v-chip
                    color="#ffd0d0"
                    v-on="on">U</v-chip></template>
                  <span>{{ item.geneType }}</span>
                </v-tooltip>

                <v-tooltip
                  v-else-if="item.geneType.endsWith('processed pseudogene')"
                  top>
                  <template v-slot:activator="{ on }"><v-chip
                    color="#ffd0d0"
                    v-on="on">Ps</v-chip></template>
                  <span>{{ item.geneType }}</span>
                </v-tooltip>

                <v-tooltip
                  v-else-if="item.geneType == 'antisense'"
                  top>
                  <template v-slot:activator="{ on }"><v-chip
                    color="#d0d0ff"
                    v-on="on">A</v-chip></template>
                  <span>{{ item.geneType }}</span>
                </v-tooltip>

                <v-tooltip
                  v-else
                  top>
                  <template v-slot:activator="{ on }"><v-chip
                    color="#e0e0e0"
                    v-on="on">?</v-chip></template>
                  <span>{{ item.geneType }}</span>
                </v-tooltip>

              </v-list-item-avatar>

              <v-list-item-content>
                <v-list-item-title> {{ item.geneSymbolUpper }} | {{ item.gencodeId }} </v-list-item-title>
                <v-list-item-subtitle>{{ item.description }} <br>
                  {{ item.genomeBuild }} {{ item.chromosome }} {{ item.start }} - {{ item.end }} ({{ item.strand }})
                </v-list-item-subtitle>
              </v-list-item-content>
            </v-list-item>
          </v-list-item-group>
        </v-list>
      </v-col>

      <v-col
        cols="8"
        class="ma-0 pa-0 pl-4">
        <h3>CFDE Anatomy Terms: <v-text-field
          v-model="uberon_ids_txt"
          dense/></h3>
        <v-btn
          :disabled="uberon_ids_txt == default_uberon_ids_txt"
          @click="uberon_ids_txt=default_uberon_ids_txt">reset</v-btn>

        <h3 class="pt-2 mt-4">Selected Gene: <span v-if="sel_gencodeId">{{ sel_geneSymbol }} | {{ sel_gencodeId }}</span><span
          v-else
          class="font-italic">none</span></h3>
        <span v-if="sel_gene">{{ sel_gene['description'] }}</span>

        <div
          v-if="sel_gencodeId"
          class="pt-2 mt-4 pl-3">
          <h4 class="pa-0 ma-0">{{ genomeVer }} Transcripts:</h4>
          <div
            id="transcript_1"
            :style="'height: ' + transcriptsHeight + 'px'"/>
        </div>
        <div
          v-if="sel_gencodeId"
          class="pt-2 mt-4 pl-3">
          <h4 class="pa-0 ma-0">{{ gtexVer }} Normalized Expression Data:</h4>
          <div>
            <v-container>
              <v-row>
                <v-col><v-switch
                  v-model="subset_by_sex"
                  label="Subset by sex"
                  class="pl-3"/></v-col>
                <v-col><v-switch
                  v-model="show_outliers"
                  label="Show outliers"
                  class="pl-3"/></v-col>
                <v-col><v-switch
                  v-model="log_scale"
                  label="Log scale"
                  class="pl-3"/></v-col>
              </v-row>
            </v-container>
          </div>
          <div id="vplot_1"/>
        </div>
      </v-col>
    </v-row>
  </v-container>
</template>

<script>
/* global $ */
/* global GTExViz */

// GTEx anatomy terms from CFDE:
/*
UBERON:0002190 subcutaneous adipose tissue
UBERON:0010414 omental fat pad
UBERON:0002369 adrenal gland
UBERON:0001496 ascending aorta
UBERON:0001621 coronary artery
UBERON:0007610 tibial artery
UBERON:0001255 urinary bladder
UBERON:0001876 amygdala
UBERON:0009835 anterior cingulate cortex
UBERON:0001873 caudate nucleus
UBERON:0002037 cerebellum
UBERON:0001870 frontal cortex
UBERON:0009834 dorsolateral prefrontal cortex
UBERON:0001954 Ammon's horn
UBERON:0001898 hypothalamus
UBERON:0001882 nucleus accumbens
UBERON:0001874 putamen
UBERON:0006469 C1 segment of cervical spinal cord
UBERON:0002038 substantia nigra
UBERON:0008367 breast epithelium
UBERON:0012249 ectocervix
UBERON:0000458 endocervix
UBERON:0001159 sigmoid colon
UBERON:0001157 transverse colon
UBERON:0004550 gastroesophageal sphincter
UBERON:0006920 esophagus squamous epithelium
UBERON:0004648 esophagus muscularis mucosa
UBERON:0003889 fallopian tube
UBERON:0006631 right atrium auricular region
UBERON:0006566 left ventricle myocardium
UBERON:0001225 cortex of kidney
UBERON:0001293 outer medulla of kidney
UBERON:0001114 right lobe of liver
UBERON:0008952 upper lobe of left lung
UBERON:0006330 anterior lingual gland
UBERON:0011907 gastrocnemius medialis
UBERON:0001323 tibial nerve
UBERON:0000992 ovary
UBERON:0001150 body of pancreas
UBERON:0000007 pituitary gland
UBERON:0002367 prostate gland
UBERON:0036149 suprapubic skin
UBERON:0004264 lower leg skin
UBERON:0001211 Peyer's patch
UBERON:0002106 spleen
UBERON:0000945 stomach
UBERON:0000473 testis
UBERON:0002046 thyroid gland
UBERON:0000995 uterus
UBERON:0000996 vagina
UBERON:0013756 venous blood
UBERON:0002371 bone marrow
*/

import axios from 'axios'

var GTEX_API = 'https://gtexportal.org/rest/v1/'
var GTEX_VER = 'gtex_v8'
var GENCODE_VER = 'v26'
var GENOME_VER = 'GRCh38/hg38'
var PAGE_SIZE = 250

var SUBSET_COLORS = {
  'male': '#aaeeff',
  'female': '#ffaa99'
}

var DEFAULT_UBERON_IDS_TXT = 'UBERON:0002037,UBERON:0013756'

var transcriptsMinHeight = 100
var transcriptHeight = 22

var transcriptConfig = {
  id: 'transcript_1',
  data: null,
  width: 800,
  height: transcriptsMinHeight,
  marginLeft: 120,
  marginRight: 20,
  marginTop: 0,
  marginBottom: 20,
  labelPos: 'left'
}

var violinConfig = {
  id: 'vplot_1',
  data: null,
  width: 800,
  height: 540,
  marginLeft: 100,
  marginRight: 80,
  marginTop: 30,
  marginBottom: 200,
  showDivider: false,
  xPadding: 0.1,
  yLabel: null,
  showGroupX: true,
  showX: true,
  xAngle: 30,
  showWhisker: false,
  showLegend: false,
  showSampleSize: false
}

export default {
  name: 'ViolinPlot',
  props: {
  },
  data () {
    return {
      gtexAPI: GTEX_API,
      gtexVer: GTEX_VER,
      gencodeVer: GENCODE_VER,
      genomeVer: GENOME_VER,
      pageSize: PAGE_SIZE,

      // gene search string
      gene_ss: '',
      gene_ss_results: [],

      sel_gene_index: null,

      // gencodeId of selected gene
      sel_gencodeId: null,
      sel_geneSymbol: null,
      sel_gene: null,

      // transcript divs
      trans_divs: [],

      // transcripts and exons of selected gene
      transcripts: null,
      exons: null,

      // tissue info
      tissue_info: null,
      uberon2tissues: null,
      detailId2tissue: null,
      // cerebellum, venous blood
      uberon_ids: DEFAULT_UBERON_IDS_TXT.split(/\s*,\s*/),
      uberon_ids_txt: DEFAULT_UBERON_IDS_TXT,
      default_uberon_ids_txt: DEFAULT_UBERON_IDS_TXT,

      // gene expression data
      expression_data: null,
      subset_by_sex: false,
      show_outliers: true,
      log_scale: false
    }
  },
  computed: {
    transcriptsHeight () {
      let height = transcriptsMinHeight
      if (this.transcripts) {
        let cheight = this.transcripts.length * transcriptHeight
        if (cheight > height) height = cheight
      }
      return height
    }
  },
  watch: {
    // gene search string reset
    gene_ss (ng) {
      if ((ng == null) || (ng === '')) {
        this.clearSearchResults()
      }
    },
    sel_gencodeId (gid) {
      if (gid == null) {
        this.clearSelectedGene()
      } else {
        this.getGeneTranscriptsAndExons(gid)
        if (this.uberon2tissues) { this.getGeneExpressionData(gid) }
      }
    },
    sel_gene_index (ind) {
      if (ind != null) {
        this.clearSelectedGene()
        this.sel_gene = this.gene_ss_results[ind]
        this.sel_gencodeId = this.gene_ss_results[ind].gencodeId
        this.sel_geneSymbol = this.gene_ss_results[ind].geneSymbolUpper
      }
    },
    // index tissues by UBERON id and tissueSiteDetailId
    tissue_info (ti) {
      let ut = {}
      let dt = {}
      ti.forEach(t => {
        let key = 'UBERON:' + t['uberonId']
        // mapping is not quite 1-1
        if (key in ut) {
          ut[key].push(t)
        } else {
          ut[key] = [t]
        }
        dt[t['tissueSiteDetailId']] = t
      })
      this.uberon2tissues = ut
      this.detailId2tissue = dt
      if (this.sel_gencodeId) { this.getGeneExpressionData(this.sel_gencodeId) }
    },
    transcripts (ts) {
      this.displayGeneStructure()
    },
    exons (es) {
      this.displayGeneStructure()
    },
    expression_data (ed) {
      this.displayExpressionData()
    },
    subset_by_sex (ss) {
      this.clearExpressionData()
      this.getGeneExpressionData(this.sel_gencodeId)
    },
    show_outliers (so) {
      this.clearExpressionData()
      this.getGeneExpressionData(this.sel_gencodeId)
    },
    log_scale (so) {
      this.clearExpressionData()
      this.getGeneExpressionData(this.sel_gencodeId)
    },
    uberon_ids_txt (nt) {
      let ids = nt.split(/\s*,\s*/)
      this.uberon_ids = ids
    }
  },
  mounted () {
    this.getTissueInfo(GTEX_VER)
  },
  methods: {
    clearSearchResults () {
      this.clearSelectedGene()
      this.gene_ss_results = []
    },
    clearSelectedGene () {
      this.sel_gene = null
      this.sel_gencodeId = null
      this.sel_geneSymbol = null
      this.sel_gene_index = null
      this.transcripts = null
      this.exons = null
      this.clearExpressionData()
      $('#transcript_1-svg').remove()
    },
    clearExpressionData () {
      this.expression_data = null
      $('#vplot_1-svg').remove()
    },
    searchClicked () {
      this.clearSelectedGene()
      const pr = this.getGeneInfo(this.gene_ss)
      let self = this
      pr.then(function (res) {
        if (res['data']['gene']) {
          self.gene_ss_results = res['data']['gene']
        }
      })
    },
    resetAll () {
      this.clearSelectedGene()
      this.gene_ss = ''
      this.uberon_ids_txt = this.default_uberon_ids_txt
    },
    gtexURLSuffix (datasetId, pageSize, format) {
      var suffix = '&gencodeVersion=' + GENCODE_VER + '&genomeBuild=' + encodeURIComponent(GENOME_VER)
      if (datasetId) suffix += '&datasetId=' + datasetId
      if (pageSize) suffix += '&pageSize=' + pageSize
      if (format) suffix += '&format=' + format
      return suffix
    },
    getGeneInfo (searchStr) {
      let geneUrl = GTEX_API + 'reference/gene?geneId=' + searchStr + this.gtexURLSuffix(GTEX_VER, PAGE_SIZE, 'json')
      return axios.get(geneUrl)
    },
    getGeneTranscripts (gencodeId) {
      let transUrl = GTEX_API + 'reference/transcript?gencodeId=' + gencodeId + this.gtexURLSuffix()
      return axios.get(transUrl)
    },
    getGeneExons (gencodeId) {
      let exonUrl = GTEX_API + 'reference/exon?gencodeId=' + gencodeId + this.gtexURLSuffix()
      return axios.get(exonUrl)
    },
    getGeneTranscriptsAndExons (gencodeId) {
      let self = this
      this.getGeneTranscripts(gencodeId).then(function (r) { self.transcripts = r.data.transcript })
      this.getGeneExons(gencodeId).then(function (r) { self.exons = r.data.exon })
    },
    displayGeneStructure () {
      if ((this.transcripts == null) || (this.exons == null)) return
      let t2exons = {}
      this.exons.forEach(e => {
        let tid = e.transcriptId
        if (!(tid in t2exons)) {
          t2exons[tid] = []
        }
        t2exons[tid].push({
          'chrom': e.chromosome.replace('chr', ''),
          'chromEnd': e.end,
          'exonId': e.exonId,
          'exonNumber': e.exonNumber,
          'chromStart': e.start,
          'strand': e.strand
        })
      })

      // display all transcripts
      let tTranscripts = this.transcripts
      let tExons = {}
      Object.keys(t2exons).forEach(k => {
        tExons[k] = t2exons[k]
      })

      transcriptConfig['height'] = this.transcriptsHeight
      transcriptConfig['data'] = { 'transcripts': tTranscripts, 'exons': tExons }
      GTExViz.transcriptTracks(transcriptConfig)
    },
    getTissueInfo (dataset) {
      let tissueUrl = GTEX_API + 'dataset/tissueInfo?datasetId=' + GTEX_VER + '&format=json'
      let self = this
      axios.get(tissueUrl).then(function (r) { self.tissue_info = r.data.tissueInfo })
    },
    getGeneExpressionData (gencodeId) {
      let subset = (this.subset_by_sex) ? 'sex' : null
      let tissues = []
      let self = this
      // look up UBERON ids
      this.uberon_ids.forEach(ui => {
        tissues = tissues.concat(self.uberon2tissues[ui])
      })

      if (tissues.length === 0) return
      let tissuesStr = '&tissueSiteDetailId=' + encodeURIComponent(tissues.map(t => t['tissueSiteDetailId']).join(','))
      let expnUrl = GTEX_API + 'expression/geneExpression?gencodeId=' + gencodeId + tissuesStr
      if (subset) expnUrl += '&attributeSubset=' + subset
      expnUrl += this.gtexURLSuffix()
      axios.get(expnUrl).then(function (r) { self.expression_data = r.data.geneExpression })
    },
    displayExpressionData () {
      if (this.expression_data == null || this.tissue_info == null) return
      let self = this
      let units = this.expression_data[0]['unit']
      violinConfig.data = []
      violinConfig.showOutliers = this.show_outliers
      violinConfig.yLabel = self.log_scale ? 'log10(' + units + '+1)' : units
      violinConfig.scale = self.log_scale ? 'log' : 'linear'

      this.expression_data.forEach(ed => {
        let t = self.detailId2tissue[ed['tissueSiteDetailId']]
        let data = self.log_scale ? ed['data'].map(d => Math.log10(+d + 1)) : ed['data']
        let tissue = {
          'group': GTEX_VER,
          'label': t['tissueSiteDetail'],
          'values': data,
          'color': '#' + t['colorHex'],
          'fill-opacity': '0.5'
        }
        if ('subsetGroup' in ed) {
          tissue['label'] = ed['subsetGroup']
          tissue['group'] = t['tissueSiteDetail']
          tissue['color'] = SUBSET_COLORS[ed['subsetGroup']]
        }
        violinConfig.data.push(tissue)
      })
      GTExViz.groupedViolinPlot(violinConfig)
    }
  }
}
</script>

<!-- doesn't work with 'scoped' - should move this into external/sitewide CSS -->
<style>

// violin plot

.violin-x-axis line,
.violin-y-axis line,
.violin-x-axis path,
.violin-y-axis path {
  font-family: 'Open Sans', 'Helvetica', 'Arial', sans-serif;
  fill: none;
  stroke: Silver;
  stroke-width: 1px;
  shape-rendering: crispEdges;
}

.violin-x-axis text,
.violin-y-axis text,
.violin-x-axis-hide text {
  font-family: 'Open Sans', 'Helvetica', 'Arial', sans-serif;
  fill: #2a718b;
}

.violin-size-axis text {
  font-family: 'Open Sans', 'Helvetica', 'Arial', sans-serif;
  fill: #239db8;
  font-size: 8px;
}

.violin-size-axis-hide text {
  font-family: 'Open Sans', 'Helvetica', 'Arial', sans-serif;
  fill: #239db8;
  font-size: 8px;
}

.violin-x-axis-hide line,
.violin-x-axis-hide path {
  fill: none;
  stroke: Silver;
  stroke-width: 0;
  shape-rendering: crispEdges;
}

.violin-size-axis-hide line,
.violin-size-axis-hide path {
  fill: none;
  stroke: Silver;
  stroke-width: 0;
  shape-rendering: crispEdges;
}

.violin-sub-axis line,
.violin-sub-axis path {
  stroke-width: 1px;
  stroke: Silver;
  shape-rendering: crispEdges;
}

.violin-sub-axis-hide line,
.violin-sub-axis-hide path {
  stroke-width: 0;
  stroke: Silver;
  shape-rendering: crispEdges;
}

.violin-sub-axis text,
.violin-sub-axis-hide text {
  fill: SlateGray;
  font-size: 9px;
  font-family: 'Open Sans', 'Helvetica', 'Arial', sans-serif;
}

.violin-axis-label {
  fill: SlateGray;
  font-size: 16px;
}

.violin-group-label {
  font-size: 9px;
  text-anchor: middle;
}

div.violin-tooltip {
  min-width: 100px;
  display: none;
  background-color: rgba(32, 53, 73, 0.95);
  padding: 10px;
  text-align: left;
  color: #ffffff;
  position: absolute;
  font-size: 12px;
  z-index: 4000;
  border-radius: 5px;
}

path.violin.highlighted {
  stroke-width: 2px;
  stroke: #555f66;
}

line.violin-median {
  stroke-width: 2px;
  stroke: #ffffff;
}

rect.violin-ir {
  fill: #555f66;
  stroke-width: 0;
}

text.violin-legend-text {
  fill: SlateGray;
  font-size: 9px;
  font-family: 'Open Sans', 'Helvetica', 'Arial', sans-serif;
}

// transcript view

line.intron {
  stroke: #000;
  stroke-width: 2px;
}

rect.exon {
  stroke: rgb(75, 134, 153);
  fill: none;
  stroke-width: 1px;
  stroke-dasharray: 0.9;
}

rect.exon-curated {
  cursor: pointer;
  stroke-width: 2px;
  stroke: rgb(85, 95, 102);
}

path.violin {
  opacity: 0.5;
}

g.tick text {
  font-size: 14px;
}

</style>
