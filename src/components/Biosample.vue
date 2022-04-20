<template>
  <v-container
    fluid
    fill-width
    class="ma-0 pa-0">

    <v-row class="ma-0 pa-0">
      <v-col
        cols="12"
        class="ma-0 pa-0">
        <div style="background-color: #336699;">
          <span class="font-weight-bold white--text"><img
            src="static/CFDE-icon-1.png"
            style="height: 2rem;"
            class="pr-2">{{ gtexVerDescr }} top {{ numTopGenes }} expressed genes for {{ uberonId }} / {{ gtexTissue.tissueSiteDetail }}</span>
        </div>
      </v-col>
    </v-row>

    <v-row class="ma-0 pa-0">
      <v-col
        cols="6"
        class="ma-0 pa-0">

        <v-data-table
          v-if="true"
          v-model="selected"
          :headers="headers"
          :items="genes"
          :items-per-page="numTopGenes"
          show-select
          single-select
          item-key="gencodeId"
          dense
          hide-default-footer
        />

        <v-list v-else>
          <v-list-item-group v-model="sel_gene_index">
            <v-list-item
              v-for="(item, i) in genes"
              :key="i">
              <v-list-item-avatar v-if="false">
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
                <v-list-item-title> {{ i+1 }}. {{ item.geneSymbolUpper }} | {{ item.gencodeId }} | {{ item.description }} | {{ item.median }} {{ item.unit }} </v-list-item-title>
                <v-list-item-subtitle v-if="false">{{ item.description }} <!-- <br>
                  {{ item.genomeBuild }} {{ item.chromosome }} {{ item.start }} - {{ item.end }} ({{ item.strand }})-->
                </v-list-item-subtitle>
              </v-list-item-content>
            </v-list-item>
          </v-list-item-group>
        </v-list>
      </v-col>

      <v-col
        cols="6"
        class="ma-0 pa-0">
        <div id="vplot_1"/>
      </v-col>
    </v-row>

  </v-container>
</template>

<script>
/* global $ */
/* global GTExViz */

import axios from 'axios'

var GTEX_API = 'https://gtexportal.org/rest/v1/'
var GTEX_VER = 'gtex_v8'
var GTEX_VER_DESCR = 'GTEx v8'
var GENCODE_VER = 'v26'
var GENOME_VER = 'GRCh38/hg38'
var PAGE_SIZE = 50

var SUBSET_COLORS = {
  'male': '#aaeeff',
  'female': '#ffaa99'
}

var violinConfig = {
  id: 'vplot_1',
  data: null,
  width: 800,
  height: 540,
  marginLeft: 100,
  marginRight: 30,
  marginTop: 30,
  marginBottom: 80,
  showDivider: false,
  xPadding: 0.1,
  yLabel: null,
  showGroupX: true,
  showX: true,
  showSubX: false,
  xAngle: 0,
  showWhisker: false,
  showLegend: false,
  showSampleSize: false
}

export default {
  name: 'ViolinPlot',
  props: {
    uberonId: {
      type: String,
      required: true,
      default: undefined
    },
    width: {
      type: Number,
      required: false,
      default: 1000
    },
    height: {
      type: Number,
      required: false,
      default: 600
    },
    numTopGenes: {
      type: Number,
      required: false,
      default: 10
    }
  },
  data () {
    return {
      gtexAPI: GTEX_API,
      gtexVer: GTEX_VER,
      gtexVerDescr: GTEX_VER_DESCR,
      gencodeVer: GENCODE_VER,
      genomeVer: GENOME_VER,
      pageSize: PAGE_SIZE,

      // tissue info
      tissue_info: null,
      uberon2tissues: null,
      detailId2tissue: null,

      // top-expressed genes
      gtexTissue: null,
      top_expressed_genes: [],
      genes: [],

      // table of top-expressed genes
      selected: [],
      headers: [
        {
          text: 'gene',
          value: 'gene',
          class: 'text-subtitle-1 font-weight-bold'
        },
        //        {
        //          text: 'Gencode ID',
        //          value: 'gencodeId',
        //          class: 'text-subtitle-1 font-weight-bold',
        //        },
        {
          text: 'TPM',
          value: 'median',
          class: 'text-subtitle-1 font-weight-bold'
        },
        {
          text: 'description',
          value: 'description',
          class: 'text-subtitle-1 font-weight-bold'
        }
      ],

      // selected gene
      sel_gene_index: null,
      sel_gencodeId: null,
      sel_geneSymbol: null,
      sel_gene: null,

      // expression data for selected gene
      expression_data: null
    }
  },
  watch: {
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
      if (this.uberonId) {
        let tissues = []
        tissues = tissues.concat(this.uberon2tissues[this.uberonId])
        this.gtexTissue = tissues[0]
      }
    },
    gtexTissue (t) {
      // retrieve top-expressed numTopGenes genes
      let tissueStr = '&tissueSiteDetailId=' + encodeURIComponent(t['tissueSiteDetailId'])
      let sortStr = '&sortBy=median&sortDirection=desc'
      let expnUrl = GTEX_API + 'expression/topExpressedGene?' + tissueStr + sortStr + this.gtexURLSuffix(GTEX_VER, this.numTopGenes, 'json')
      let self = this
      axios.get(expnUrl).then(function (r) { self.top_expressed_genes = r.data.topExpressedGene })
    },
    top_expressed_genes (teg) {
      // retrieve detailed annotation for top-expressed genes
      let genesUrl = GTEX_API + 'reference/gene?geneId=' + encodeURIComponent(teg.map(x => x.gencodeId).join(',')) + this.gtexURLSuffix(GTEX_VER, PAGE_SIZE, 'json')
      let self = this
      axios.get(genesUrl).then(function (r) { self.setGenes(r.data.gene) })
    },
    sel_gencodeId (gid) {
      if (gid == null) {
        this.clearSelectedGene()
      } else {
        //        this.getGeneTranscriptsAndExons(gid);
        if (this.uberon2tissues) { this.getGeneExpressionData(gid) }
      }
    },
    sel_gene_index (ind) {
      if (ind != null) {
        this.clearSelectedGene()
        this.sel_gene = this.genes[ind]
        this.sel_gencodeId = this.genes[ind].gencodeId
        this.sel_geneSymbol = this.genes[ind].geneSymbol
      }
    },
    selected (sel) {
      this.clearSelectedGene()
      if (sel.length > 0) {
        this.sel_gene = sel[0]
        this.sel_gencodeId = sel[0].gencodeId
        this.sel_geneSymbol = sel[0].geneSymbol
      }
    },
    expression_data (ed) {
      this.displayExpressionData()
    }
  },
  mounted () {
    this.getTissueInfo(GTEX_VER)
  },
  methods: {
    gtexURLSuffix (datasetId, pageSize, format) {
      var suffix = ''
      if (datasetId) suffix += '&datasetId=' + datasetId
      if (pageSize) suffix += '&pageSize=' + pageSize
      if (format) suffix += '&format=' + format
      return suffix
    },
    getTissueInfo (dataset) {
      let tissueUrl = GTEX_API + 'dataset/tissueInfo?datasetId=' + GTEX_VER + '&format=json'
      let self = this
      axios.get(tissueUrl).then(function (r) { self.tissue_info = r.data.tissueInfo })
    },
    setGenes (gl) {
      // sort genes according to expression level
      let id2gene = {}
      gl.forEach(g => { id2gene[g.gencodeId] = g })
      let sortedGenes = []
      let ind = 0
      this.top_expressed_genes.forEach(teg => {
        let g = id2gene[teg.gencodeId]
        g['median'] = teg['median']
        g['unit'] = teg['unit']
        g['gene'] = ++ind + '. ' + g['geneSymbolUpper']
        let descr = g['description']
        g['description'] = descr.substring(0, descr.indexOf('['))
        sortedGenes.push(g)
      })
      this.genes = sortedGenes
      this.selected = [sortedGenes[0]]
    },
    clearExpressionData () {
      this.expression_data = null
      $('#vplot_1-svg').remove()
    },
    clearSelectedGene () {
      this.sel_gene = null
      this.sel_gencodeId = null
      this.sel_geneSymbol = null
      this.sel_gene_index = null
      //      this.transcripts = null;
      //      this.exons = null;
      this.clearExpressionData()
      //      $("#transcript_1-svg").remove();
    },
    getGeneExpressionData (gencodeId) {
      //      let subset = (this.subset_by_sex) ? 'sex' : null;
      let subset = null
      let self = this
      if (this.tissue_info == null) return
      let tissuesStr = '&tissueSiteDetailId=' + this.gtexTissue['tissueSiteDetailId']
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
      violinConfig.width = this.width / 2
      violinConfig.height = this.height - 60

      this.expression_data.forEach(ed => {
        let t = self.detailId2tissue[ed['tissueSiteDetailId']]
        let data = self.log_scale ? ed['data'].map(d => Math.log10(+d + 1)) : ed['data']
        let tissue = {
          'group': this.sel_gene.gene,
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
