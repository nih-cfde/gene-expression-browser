<template>
  <v-container
    fluid
    fill-width
    class="ma-0 pa-0">

    <v-row
      v-if="!hideTitle"
      class="ma-0 pa-0">
      <v-col
        cols="12"
        class="ma-0 pa-0">
        <div style="background-color: #336699;">
          <span class="font-weight-bold white--text"><img
            src="static/CFDE-icon-1.png"
            style="height: 2rem;"
            class="pr-2">{{ gtexVerDescr }} expression data for {{ refUberonId }} / {{ gtexTissues != null ? gtexTissues[0].tissueSiteDetail : '' }}</span>
        </div>
      </v-col>
    </v-row>

    <v-row class="ma-0 py-2">
      <v-col class="ma-0 pa-0">

        <!-- gene selection mode -->
        <v-radio-group
          v-model="gene_sel_mode"
          mandatory
          row
          class="pa-0 ma-0 pl-3"
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
      </v-col>

      <v-col class="ma-0 pa-0">
        <!-- display options -->
        <v-switch
          v-model="include_mito_genes"
          :disabled="showSelectedGenes"
          label="Include mitochondrial genes"
          class="pa-0 ma-0"
          dense
          hide-details/>
      </v-col>
    </v-row>

    <v-row class="ma-0 pa-0">
      <v-col
        cols="5"
        class="ma-0 pa-0">

        <div
          v-if="showSelectedGenes"
          class="pb-2">
          <add-genes-dialog
            :gtex-api="gtexAPI"
            :gtex-ver="gtexVer"
            :page-size="pageSize"
            :selected-genes="selected_genes_d"
            @add_gene="addGene"
            @dialog_closed="addGenesDialogClosed"
          />
          <v-btn
            :disabled="tableGenes.length === 0"
            small
            color="primary"
            class="ml-1"
            @click="removeAllGenes"><v-icon>mdi-minus</v-icon>Remove all</v-btn>
        </div>

        <!-- show top N genes -->
        <v-data-table
          v-model="selected"
          :headers="headers"
          :items="tableGenes"
          :items-per-page="numTopGenes"
          :height="height - tableVpad"
          item-key="gencodeId"
          dense
          hide-default-footer
        >

          <template v-slot:item="{ item }">
            <tr>
              <td
                class="text-xs-left"
                style="white-space: nowrap;">
                <v-chip
                  v-if="item.gencodeId in top_expressed_genes_d"
                  :color="'rgba(' + top_expressed_genes_d[item.gencodeId].colorRgb + ',0.5)'"
                  label
                  small
                  class="mr-2 pa-1"><span :style="rankStyle(top_expressed_genes_d[item.gencodeId].colorHex)">{{ top_expressed_genes_d[item.gencodeId].rank }}</span>
                </v-chip>{{ item.gene }}
              </td>

              <td class="text-xs-left">{{ getGeneExpInRef(item) }}</td>

              <td
                class="text-xs-left"
                style="max-width: 1px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;"
              >
                {{ getGeneDescr(item) }}
              </td>
            </tr>
          </template>

        </v-data-table>
      </v-col>

      <v-col
        cols="7"
        class="ma-0 pa-0">
        <div id="hmplot_1"/>

        <v-container
          v-if="showSelectedGenes && (tableGenes.length === 0)"
          fluid
          fill-width>
          <v-row>
            <v-col cols="12">
              <div
                column
                align-center
                justify-center
                fill-width
                class="py-3 text-center">
                <span class="title text--secondary">
                  No gene(s) selected.
                </span>
              </div>
            </v-col>
          </v-row>
        </v-container>

      </v-col>
    </v-row>

  </v-container>
</template>

<script>
/* global $ */
/* global GTExViz */

import axios from 'axios'
import AddGenesDialog from '@/components/AddGenesDialog.vue'

var GTEX_API = 'https://gtexportal.org/rest/v1/'
var GTEX_VER = 'gtex_v8'
var GTEX_VER_DESCR = 'GTEx v8'
var GENCODE_VER = 'v26'
var GENOME_VER = 'GRCh38/hg38'
var PAGE_SIZE = 50
var VPAD = 40
var TABLE_VPAD = 40
var TITLE_HEIGHT = 40
var SEARCH_GENES_HEIGHT = 35
var MAX_BAND_WIDTH = 50

var HEATMAP_CONFIG = {
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
  components: {
    AddGenesDialog
  },
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
    },
    hideTitle: {
      type: Number,
      required: false,
      default: 0
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
      top_expressed_genes_d: {},
      // gene info from reference/gene
      genes: null,
      id2gene: {},
      // genes to display
      topGenes: null,

      // expression data for all tissues
      tg2expression: null,

      // table of top-expressed genes
      selected: [],
      headers: [
        {
          text: 'gene',
          value: 'gene',
          width: '15%',
          sortable: false
        },
        {
          text: 'median TPM',
          value: 'median',
          width: '20%',
          sortable: false
        },
        {
          text: 'description',
          value: 'description',
          width: '65%',
          sortable: false
        }
      ],

      // gene selection mode
      gene_sel_mode: 'top',

      // include mitochrondrial genes
      include_mito_genes: true,

      // user-selected genes
      selected_genes: [],
      selected_genes_d: {}
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
    },
    tableGenes () {
      if (this.showSelectedGenes) {
        return this.selected_genes
      }
      return this.topGenes != null ? this.topGenes : []
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
      if (ts == null) return
      // retrieve top-expressed numTopGenes genes
      let tissueStr = '&tissueSiteDetailId=' + encodeURIComponent(ts[0]['tissueSiteDetailId'])
      let sortStr = '&sortBy=median&sortDirection=desc'
      // workaround for bug in GTEx API, which filters if 'filterMtGene=false'
      let mitoStr = this.include_mito_genes ? '' : '&filterMtGene=true'
      let expnUrl = GTEX_API + 'expression/topExpressedGene?' + tissueStr + sortStr + mitoStr + this.gtexURLSuffix(GTEX_VER, this.numTopGenes, 'json')
      let self = this
      axios.get(expnUrl).then(function (r) { self.setTopExpressedGenes(r.data.topExpressedGene) })
    },
    top_expressed_genes (teg) {
      let self = this
      // retrieve median TPM values for *all* requested tissues
      let expnUrl = this.medianExpressionURL(teg, this.gtexTissues)
      axios.get(expnUrl).then(function (r) { self.addExpressionData(r.data.medianGeneExpression) })

      // retrieve detailed annotation for selected genes
      let genesUrl = GTEX_API + 'reference/gene?geneId=' + encodeURIComponent(teg.map(x => x.gencodeId).join(',')) + this.gtexURLSuffix(GTEX_VER, PAGE_SIZE, 'json')
      axios.get(genesUrl).then(function (r) { self.setGenes(r.data.gene) })
    },
    tg2expression () {
      this.displayExpressionData()
    },
    genes () {
      this.displayExpressionData()
    },
    include_mito_genes (inc) {
      // trigger reload
      this.genes = null
      let gt = this.gtexTissues.slice()
      this.gtexTissues = gt
    },
    gene_sel_mode () {
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
    medianExpressionURL (genes, tissues) {
      let expnUrl = GTEX_API + 'expression/medianGeneExpression?' +
        'gencodeId=' + encodeURIComponent(genes.map(x => x.gencodeId).join(',')) +
          '&tissueSiteDetailId=' + encodeURIComponent(tissues.map(x => x.tissueSiteDetailId).join(',')) +
          this.gtexURLSuffix(GTEX_VER, PAGE_SIZE, 'json')
      return expnUrl
    },
    getGeneDescr (g) {
      if ((g.description === null) || (g.description === '')) return '-'
      return g.description.substring(0, g.description.indexOf('['))
    },
    getGeneExpInRef (g) {
      let key = this.gtexTissues[0].tissueSiteDetailId + ':' + g.gencodeId
      if ((this.tg2expression != null) && (key in this.tg2expression)) {
        let ev = this.tg2expression[key].median
        return ev.toFixed(2)
      }
      return '-'
    },
    getTissueInfo (dataset) {
      let tissueUrl = GTEX_API + 'dataset/tissueInfo?datasetId=' + GTEX_VER + '&format=json'
      let self = this
      axios.get(tissueUrl).then(function (r) { self.tissue_info = r.data.tissueInfo })
    },
    setTopExpressedGenes (teg) {
      this.top_expressed_genes = teg
      this.top_expressed_genes_d = {}
      this.top_expressed_genes.forEach(g => {
        this.top_expressed_genes_d[g.gencodeId] = g
      })
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
        teg['description'] = g['description']
        teg['rank'] = rank++
        teg['colorHex'] = tissue['colorHex']
        teg['colorRgb'] = tissue['colorRgb']
      })
      this.id2gene = id2gene
      this.genes = sortedGenes
      if (!this.showSelectedGenes) this.topGenes = this.top_expressed_genes
    },
    addExpressionData (ed) {
      // index expression data by tissue and gencodeId
      let tg2expression = {...this.tg2expression}
      ed.forEach(d => {
        let key = d.tissueSiteDetailId + ':' + d.gencodeId
        tg2expression[key] = d
      })
      this.tg2expression = tg2expression
    },
    clearExpressionData () {
      $('#hmplot_1-svg').remove()
    },
    displayExpressionData () {
      if (this.genes == null || this.tissue_info == null || this.tg2expression == null) return
      this.clearExpressionData()
      if (this.tableGenes.length === 0) return
      let heatmapConfig = {...HEATMAP_CONFIG}
      heatmapConfig.data = []
      heatmapConfig.width = Math.floor(this.width * (7 / 12.0))
      heatmapConfig.height = this.height - this.vpad
      // control max band width by increasing right margin
      // TODO - account for space taken by the right hand side row labels
      let hspace = heatmapConfig.width - (heatmapConfig.marginRight + heatmapConfig.marginLeft)
      let extraHspace = hspace - (this.gtexTissues.length * MAX_BAND_WIDTH)
      heatmapConfig.marginRight = 120 + ((extraHspace > 0) ? extraHspace : 0)

      // loop over genes and tissues
      this.tableGenes.forEach(g => {
        this.gtexTissues.forEach(gt => {
          let key = gt.tissueSiteDetailId + ':' + g.gencodeId
          let ed = this.tg2expression[key]
          let lbl = ('rank' in g) ? g['rank'] + '. ' : ''
          lbl = lbl + g['geneSymbol']
          let gd = {
            'x': gt['tissueSiteDetailId'],
            'y': lbl,
            'value': ed['median'],
            'displayValue': ed['median'].toFixed(2),
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
    },
    addGene (g) {
      if (g.gencodeId in this.selected_genes_d) return
      g.gene = g.geneSymbolUpper
      g.median = null
      this.selected_genes.push(g)
      // force update
      let selG = {...this.selected_genes_d}
      selG[g.gencodeId] = 1
      this.selected_genes_d = selG
    },
    removeAllGenes () {
      this.selected_genes = []
      this.selected_genes_d = {}
      this.displayExpressionData()
    },
    addGenesDialogClosed () {
      let self = this
      let expnUrl = this.medianExpressionURL(this.selected_genes, this.gtexTissues)
      axios.get(expnUrl).then(function (r) { self.addExpressionData(r.data.medianGeneExpression) })
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
