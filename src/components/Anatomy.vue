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
            class="pr-2">Gene expression data for {{ uberonId }} / {{ gtexTissue != null ? gtexTissue.tissueSiteDetail : '' }}</span>
        </div>
      </v-col>
    </v-row>

    <v-row class="ma-0 pa-0">
      <v-col
        cols="5"
        class="ma-0 pa-0">

        <!-- gene selection mode -->
        <v-radio-group
          v-model="gene_sel_mode"
          mandatory
          row
          class="pa-0 ma-0 pl-3 pt-2 pb-2"
          hide-details
        >
          Show:
          <v-radio
            key="tsg-1"
            :label="'Top ' + numTopGenes + ' genes' + (gtexTissue != null ? ' in ' + gtexTissue.tissueSiteDetail : '')"
            value="top"
            class="pa-0 ma-0 pl-2"
            hide-details
          />
          <v-radio
            key="tsg-2"
            label="Specific gene(s)"
            value="custom"
            class="pa-0 ma-0 pl-4"
            hide-details
          />
        </v-radio-group>

        <!-- show top N genes -->
        <v-data-table
          v-if="!showSelectedGenes"
          v-model="selected"
          :headers="headers"
          :items="genes"
          :items-per-page="numTopGenes"
          :height="height - tableVpad"
          item-key="gencodeId"
          dense
          hide-default-footer
        />

        <div
          v-else
          column
          align-center
          justify-center
          fill-width
          class="py-3 text-center">
          <span class="title text--secondary">
            Not yet implemented.
          </span>
        </div>

      </v-col>

      <v-col
        cols="7"
        class="ma-0 pa-0">
        <div id="hmplot_1"/>
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
var VPAD = 25
var TABLE_VPAD = 10
var TITLE_HEIGHT = 40
var CONTROLS_HEIGHT = 30
var SEARCH_GENES_HEIGHT = 35

var heatmapConfig = {
  id: 'hmplot_1',
  data: null,
  width: 800,
  height: 540,
  marginLeft: 40,
  marginRight: 120,
  marginTop: 50,
  marginBottom: 80,
  // values defined in GTExViz src/modules/colors.js
  colorScheme: 'YlGnBu',
  cornerRadius: 1,
  columnLabelHeight: 20,
  columnLabelAngle: 45,
  columnLabelPosAdjust: 15,
  rowLabelWidth: 15
}

export default {
  name: 'Anatomy',
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
          sortable: false
        },
        {
          text: 'median TPM',
          value: 'median',
          sortable: false
        },
        {
          text: 'description',
          value: 'description',
          sortable: false
        }
      ],

      // gene selection mode
      gene_sel_mode: 'top',

      // selected gene
      sel_gene_index: null,
      sel_gencodeId: null,
      sel_geneSymbol: null,
      sel_gene: null

    }
  },
  computed: {
    // amount to subtract from externally-specified component height to avoid vertical scrolling
    vpad () {
      return this.adjustVpad(VPAD)
    },
    tableVpad () {
      let vp = this.adjustVpad(TABLE_VPAD)
      return this.showSelectedGenes ? vp + SEARCH_GENES_HEIGHT : vp
    },
    showSelectedGenes () {
      return this.gene_sel_mode === 'custom'
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
    sel_gene_index (ind) {
      if (ind != null) {
        this.sel_gene = this.genes[ind]
        this.sel_gencodeId = this.genes[ind].gencodeId
        this.sel_geneSymbol = this.genes[ind].geneSymbol
      }
    },
    selected (sel) {
      if (sel.length > 0) {
        this.sel_gene = sel[0]
        this.sel_gencodeId = sel[0].gencodeId
        this.sel_geneSymbol = sel[0].geneSymbol
      }
    },
    genes () {
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
      let self = this;
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
        let fields = ['median', 'unit', 'tissueSiteDetailId']
        fields.forEach(field => { g[field] = teg[field] })
        g['gene'] = ++ind + '. ' + g['geneSymbolUpper']
        let descr = g['description']
        g['description'] = descr.substring(0, descr.indexOf('['))
        sortedGenes.push(g)
      })
      this.genes = sortedGenes
      this.selected = [sortedGenes[0]]
    },
    clearExpressionData () {
      $('#hmplot_1-svg').remove()
    },
    displayExpressionData () {
      if (this.genes == null || this.tissue_info == null) return
      //      let units = this.genes[0]['unit']
      heatmapConfig.data = []
      heatmapConfig.width = Math.floor(this.width * (7 / 12.0))
      heatmapConfig.height = this.height - 60

      this.genes.forEach(g => {
        let gd = {
          'x': g['tissueSiteDetailId'],
          'y': g['geneSymbol'],
          'value': g['median'],
          'displayValue': g['median']
        }
        heatmapConfig.data.push(gd)
      })

      GTExViz.heatmap(heatmapConfig)
    },
    adjustVpad (vpad) {
      let vp = vpad
      if (!this.hideTitle) {
        vp += TITLE_HEIGHT
      }
      if (!this.hideControls) {
        vp += CONTROLS_HEIGHT
      }
      return vp
    }
  }
}

</script>
<style>

text.color-legend {
    font-family: "Open Sans", "Helvetica", "Arial", sans-serif;
    font-size: 10px;
}

text.exp-map-xlabel {
    font-family: "Open Sans", "Helvetica", "Arial", sans-serif;
    font-size: 10px;
}
text.exp-map-xlabel.highlighted {
    font-weight: 400;
    font-size: 12px;
    text-decoration: underline;
}
text.exp-map-xlabel.query {
    font-weight: 600;
    font-size:11px;
    fill: #d2111b;
}

text.exp-map-ylabel {
    font-family: "Open Sans", "Helvetica", "Arial", sans-serif;
    font-size: 10px;
}
text.exp-map-ylabel.highlighted {
    font-weight: 400;
    font-size: 12px;
    text-decoration: underline;
}
text.exp-map-ylabel.clicked, text.exp-map-xlabel.clicked {
    fill: #D25C43;
}

rect.exp-map-cell {
    stroke-width:0px;
}
rect.exp-map-cell.highlighted {
    stroke: #D25C43;
    stroke-width:2px;
}

div.heatmap-tooltip {
   min-width: 100px;
   display: none;
   background-color : rgba(32, 53, 73, 0.95);
   padding: 10px;
   text-align:left;
   color: #ffffff;
   position:absolute;
   font-size:12px;
   z-index:4000;
   border-radius:5px;
}

</style>
