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
            class="pr-2">Gene expression data for {{ refUberonId }} / {{ gtexTissues != null ? gtexTissues[0].tissueSiteDetail : '' }}</span>
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
            :label="'Top ' + numTopGenes + ' genes' + (gtexTissues != null ? ' in ' + gtexTissues[0].tissueSiteDetail : '')"
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
          :items="selectedGenes != null ? selectedGenes : []"
          :items-per-page="numTopGenes"
          :height="height - tableVpad"
          item-key="gencodeId"
          dense
          hide-default-footer
        >

          <template v-slot:item.gene="{ item }">
            <td class="text-xs-left">
              <v-chip
                :color="'#' + item.colorHex"
                label
                small
                class="mr-2 pa-1"><span :style="rankStyle(item.colorHex)">{{ item.rank }}</span>
              </v-chip>{{ item.gene }}
            </td>
          </template>

        </v-data-table>

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
var MAX_BAND_WIDTH = 50

var heatmapConfig = {
  id: 'hmplot_1',
  data: null,
  width: 800,
  height: 540,
  marginLeft: 40,
  marginRight: 120,
  marginTop: 50,
  marginBottom: 100,
  // values defined in GTExViz src/modules/colors.js
  colorScheme: 'YlGnBu',
  cornerRadius: 3,
  columnLabelHeight: 5,
  columnLabelAngle: 30,
  columnLabelPosAdjust: 10,
  rowLabelWidth: 12
}

export default {
  name: 'Anatomy',
  props: {
    uberonIds: {
      type: String,
      required: true,
      default: null
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

      // uberon ids as an array
      uberonIdList: null,

      // tissue info
      tissue_info: null,
      uberon2tissues: null,
      detailId2tissue: null,

      gtexTissues: null,
      // top-expressed genes from expression/topExpressedGene
      top_expressed_genes: null,
      // gene info from reference/gene
      genes: null,
      id2gene: {},
      // genes to display
      selectedGenes: null,

      // expression data for all tissues
      expression_data: null,
      tg2expression: null,

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
      gene_sel_mode: 'top'

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
    },
    refUberonId () {
      return this.uberonIdList != null ? this.uberonIdList[0] : null
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
      if (this.uberonIds) {
        let uids = this.uberonIds.split(',')
        let tissues = []
        uids.forEach(uid => {
          tissues = tissues.concat(this.uberon2tissues[uid])
          this.gtexTissues = tissues
        })
        this.uberonIdList = uids
      }
    },
    gtexTissues (ts) {
      // retrieve top-expressed numTopGenes genes
      let tissueStr = '&tissueSiteDetailId=' + encodeURIComponent(ts[0]['tissueSiteDetailId'])
      let sortStr = '&sortBy=median&sortDirection=desc'
      let expnUrl = GTEX_API + 'expression/topExpressedGene?' + tissueStr + sortStr + this.gtexURLSuffix(GTEX_VER, this.numTopGenes, 'json')
      let self = this
      axios.get(expnUrl).then(function (r) { self.setTopExpressedGenes(r.data.topExpressedGene) })
    },
    top_expressed_genes (teg) {
      let self = this
      // retrieve median TPM values for *all* requested tissues
      let expnUrl = GTEX_API + 'expression/medianGeneExpression?' +
        'gencodeId=' + encodeURIComponent(teg.map(x => x.gencodeId).join(',')) +
          '&tissueSiteDetailId=' + encodeURIComponent(this.gtexTissues.map(x => x.tissueSiteDetailId).join(',')) +
          this.gtexURLSuffix(GTEX_VER, PAGE_SIZE, 'json')
      axios.get(expnUrl).then(function (r) { self.setExpressionData(r.data.medianGeneExpression) })

      // retrieve detailed annotation for selected genes
      let genesUrl = GTEX_API + 'reference/gene?geneId=' + encodeURIComponent(teg.map(x => x.gencodeId).join(',')) + this.gtexURLSuffix(GTEX_VER, PAGE_SIZE, 'json')
      axios.get(genesUrl).then(function (r) { self.setGenes(r.data.gene) })
    },
    expression_data () {
      this.displayExpressionData()
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
      let self = this
      axios.get(tissueUrl).then(function (r) { self.tissue_info = r.data.tissueInfo })
    },
    setTopExpressedGenes (teg) {
      this.top_expressed_genes = teg
    },
    setGenes (gl) {
      // sort genes according to expression level
      let id2gene = {}
      gl.forEach(g => { id2gene[g.gencodeId] = g })
      let sortedGenes = []
      let rank = 1
      let tissue = this.gtexTissues[0]
      this.top_expressed_genes.forEach(teg => {
        let g = id2gene[teg.gencodeId]
        sortedGenes.push(g)
        teg['gene'] = g['geneSymbolUpper']
        teg['description'] = g['description'].substring(0, g['description'].indexOf('['))
        teg['rank'] = rank++
        teg['colorHex'] = tissue['colorHex']
      })
      this.id2gene = id2gene
      this.genes = sortedGenes
      if (!this.showSelectedGenes) this.selectedGenes = this.top_expressed_genes
    },
    setExpressionData (ed) {
      // index expression data by tissue and gencodeId
      let tg2expression = {}
      ed.forEach(d => {
        let key = d.tissueSiteDetailId + ':' + d.gencodeId
        tg2expression[key] = d
      })
      this.tg2expression = tg2expression
      this.expression_data = ed
    },
    clearExpressionData () {
      $('#hmplot_1-svg').remove()
    },
    displayExpressionData () {
      if (this.genes == null || this.tissue_info == null || this.tg2expression == null) return
      heatmapConfig.data = []
      heatmapConfig.width = Math.floor(this.width * (7 / 12.0))
      heatmapConfig.height = this.height - 60
      // control max band width by increasing right margin
      // TODO - account for space taken by the right hand side row labels
      let hspace = heatmapConfig.width - (heatmapConfig.marginRight + heatmapConfig.marginLeft)
      let extraHspace = hspace - (this.gtexTissues.length * MAX_BAND_WIDTH)
      heatmapConfig.marginRight = 120 + ((extraHspace > 0) ? extraHspace : 0)

      // loop over genes and tissues
      this.selectedGenes.forEach(g => {
        this.gtexTissues.forEach(gt => {
          let key = gt.tissueSiteDetailId + ':' + g.gencodeId
          let ed = this.tg2expression[key]
          let gd = {
            'x': gt['tissueSiteDetailId'],
            'y': g['rank'] + '. ' + g['geneSymbol'],
            'value': ed['median'],
            'displayValue': ed['median'],
            'unit': ed['unit']
          }
          heatmapConfig.data.push(gd)
        })
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
    },
    // return dark font color for light background and vice versa
    rankStyle (colorHex) {
      let res = colorHex.match(/^([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i)
      let r = parseInt(res[1], 16)
      let g = parseInt(res[2], 16)
      let b = parseInt(res[3], 16)
      let lum = (0.299 * r + 0.587 * g + 0.114 * b) / 255.0
      if (lum > 0.5) {
        return 'color: black;'
      } else {
        return 'color: white;'
      }
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
