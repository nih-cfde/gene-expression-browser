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
            class="pr-2">{{ gtexVerDescr }} normalized expression data for {{ sel_gencodeId }}</span>
        </div>
      </v-col>
    </v-row>

    <v-row class="ma-0 pa-0">
      <v-col
        cols="6"
        class="ma-0 pa-0">

        <!-- tissue selection mode -->
        <v-radio-group
          v-model="tissue_sel_mode"
          mandatory
          row
          class="pa-0 ma-0 pl-3 pt-2 pb-2"
          hide-details
        >
          Compare:
          <v-radio
            key="tsm-1"
            :label="'Top ' + numTopTissues + ' tissues'"
            value="top"
            class="pa-0 ma-0 pl-2"
            hide-details
          />
          <v-radio
            key="tsm-2"
            label="Specific tissue(s) only"
            value="custom"
            class="pa-0 ma-0 pl-4"
            hide-details
          />
        </v-radio-group>

        <v-text-field
          v-if="showSelected"
          v-model="tissueSearch"
          append-icon="mdi-magnify"
          label="Search tissues"
          single-line
          hide-details
          class="ma-0 pa-0 ml-3 mb-1"
        />

        <!-- don't subset by sex -->
        <v-data-table
          v-if="!subset_by_sex"
          v-model="selected"
          :headers="headers"
          :items="tableTissues"
          :items-per-page="showSelected ? allTissues.length : numTopTissues"
          :height="height - tableVpad"
          :show-select="showSelected"
          :search="showSelected ? tissueSearch : null"
          item-key="tissueSiteDetailId"
          dense
          hide-default-footer
        >
          <template v-slot:item.tissueSiteDetail="{ item }">
            <td class="text-xs-left">
              <v-chip
                :color="'rgba(' + item.colorRgb + ',0.5)'"
                label
                small
                class="mr-2"><span :style="rankStyle(item.colorHex)">{{ item.rank }}</span></v-chip>

              <v-tooltip
                top
                color="primary">
                <template v-slot:activator="{ on }">
                  <span v-on="on">
                    {{ item.tissueSiteDetail }}
                  </span>
                </template>
                <span>{{ item.samplingSite }}</span>
              </v-tooltip>
            </td>
          </template>
        </v-data-table>

        <!-- subset by sex -->
        <v-data-table
          v-else
          v-model="selected"
          :headers="headers_by_sex"
          :items="tableTissues"
          :items-per-page="showSelected ? allTissues.length : numTopTissues"
          :height="height - tableVpad"
          :show-select="showSelected"
          :search="showSelected ? tissueSearch : null"
          item-key="tissueSiteDetailId"
          dense
          hide-default-footer
        >

          <template v-slot:header="props" >
            <thead>
              <tr>
                <th colspan="1"/>
                <th colspan="2">female</th>
                <th colspan="2">male</th>
              </tr>
            </thead>
          </template>

          <template v-slot:item.tissueSiteDetail="{ item }">
            <td class="text-xs-left">
              <v-chip
		:color="'rgba(' + item.colorRgb + ',0.5)'"
                label
                small
                class="mr-2"/>

              <v-tooltip
                top
                color="primary">
                <template v-slot:activator="{ on }">
                  <span v-on="on">
                    {{ item.tissueSiteDetail }}
                  </span>
                </template>
                <span>{{ item.samplingSite }}</span>
              </v-tooltip>
            </td>
          </template>
        </v-data-table>
      </v-col>
      <v-col
        cols="6"
        class="ma-0 pa-0">
        <div
          v-if="sel_gencodeId"
          class="pa-0 ma-0">

          <v-container
            v-if="!hideControls"
            class="pa-0 ma-0 pt-2 pb-4">
            <v-row
              class="pa-0 ma-0"
              style="padding-left: 50px;">
              <!-- workaround to align left edge of switches near graph y-axis -->
              <v-col
                cols="2"
                class="pa-0 ma-0">
                <v-spacer />
              </v-col>
              <v-col class="pa-0 ma-0">
                <v-switch
                  v-model="subset_by_sex"
                  label="Subset by sex"
                  class="pa-0 ma-0"
                  dense
                  hide-details/>
              </v-col>
              <v-col class="pa-0 ma-0">
                <v-switch
                  v-model="show_outliers"
                  label="Show outliers"
                  class="pa-0 ma-0"
                  dense
                  hide-details/>
              </v-col>
              <v-col class="pa-0 ma-0">
                <v-switch
                  v-model="log_scale"
                  label="Log scale"
                  class="pa-0 ma-0"
                  dense
                  hide-details/>
              </v-col>
            </v-row>
          </v-container>

          <div
            id="vplot_1"
            :height="height - vpad"
            class="pa-0 ma-0"/>

          <v-container
            v-if="showSelected && (selected.length === 0)"
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
                    No tissue(s) selected.
                  </span>
                </div>
              </v-col>
            </v-row>
          </v-container>

        </div>
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
var PAGE_SIZE = 250
var VPAD = 25
var TABLE_VPAD = 10
var TITLE_HEIGHT = 40
var CONTROLS_HEIGHT = 30
var SEARCH_TISSUES_HEIGHT = 35

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
  marginRight: 15,
  marginTop: 0,
  marginBottom: 15,
  showDivider: false,
  xPadding: 0.1,
  yLabel: null,
  showGroupX: false,
  showX: false,
  showSubX: false,
  xAngle: 30,
  showWhisker: false,
  showLegend: false,
  showSampleSize: false
}

export default {
  name: 'GeneTopTissues',
  props: {
    gencodeId: {
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
    numTopTissues: {
      type: Number,
      required: false,
      default: 10
    },
    hideTitle: {
      type: Number,
      required: false,
      default: 0
    },
    hideControls: {
      type: Number,
      required: false,
      default: 0
    },
    uberonIds: {
      type: String,
      required: false,
      default: null
    },
    tissueSiteDetailIds: {
      type: String,
      required: false,
      default: null
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

      // gencodeId of selected gene
      sel_gencodeId: null,
      sel_geneSymbol: null,
      sel_gene: null,

      // tissue info
      tissue_sel_mode: 'top',
      tissue_info: null,
      uberon2tissues: null,
      detailId2tissue: null,
      tissueSearch: '',

      // gene expression data
      allExpressionData: null,
      expressionData: null,
      subset_by_sex: false,
      show_outliers: true,
      log_scale: false,

      // table of tissues with the highest expression
      topTissues: [],
      allTissues: [],
      selected: [],
      headers: [
        {
          text: 'tissue',
          value: 'tissueSiteDetail',
          sortable: false
        },
        {
          text: 'median TPM',
          value: 'median',
          sortable: false
        },
        {
          text: 'samples',
          value: 'count',
          sortable: false
        }
      ],
      headers_by_sex: [
        {
          text: 'tissue',
          value: 'tissueSiteDetail',
          sortable: false
        },
        {
          text: 'median TPM',
          value: 'median-female',
          sortable: false
        },
        {
          text: 'samples',
          value: 'count-female',
          sortable: false
        },
        {
          text: 'median TPM',
          value: 'median-male',
          sortable: false
        },
        {
          text: 'samples',
          value: 'count-male',
          sortable: false
        }

      ]
    }
  },
  computed: {
    // amount to subtract from externally-specified component height to avoid vertical scrolling
    vpad () {
      return this.adjustVpad(VPAD)
    },
    tableVpad () {
      let vp = this.adjustVpad(TABLE_VPAD)
      return this.showSelected ? vp + SEARCH_TISSUES_HEIGHT : vp
    },
    showSelected () {
      return this.tissue_sel_mode === 'custom'
    },
    tableTissues () {
      return this.showSelected ? this.allTissues : this.topTissues
    }
  },
  watch: {
    sel_gencodeId (gid) {
      if (gid == null) {
        this.clearSelectedGene()
      } else {
        if (this.uberon2tissues) { this.getGeneExpressionData(gid) }
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
      if ((this.uberonIds !== '') || (this.tissueSiteDetailIds !== '')) {
        this.selectTissuesFromQuery()
      }
    },
    expressionData () {
      this.displayExpressionData()
    },
    subset_by_sex () {
      this.displayExpressionData()
    },
    show_outliers () {
      this.displayExpressionData()
    },
    log_scale () {
      this.displayExpressionData()
    },
    selected () {
      this.displayExpressionData()
    },
    tissue_sel_mode () {
      this.displayExpressionData()
    }
  },
  mounted () {
    this.getTissueInfo(GTEX_VER)
    this.clearSelectedGene()
    const pr = this.getGeneInfo(this.gencodeId)
    let self = this
    pr.then(function (res) {
      if (res['data']['gene']) {
        self.sel_gencodeId = res['data']['gene'][0]['gencodeId']
      }
    })
  },
  methods: {
    clearSelectedGene () {
      this.sel_gene = null
      this.sel_gencodeId = null
      this.sel_geneSymbol = null
      this.transcripts = null
      this.exons = null
      this.clearExpressionData()
    },
    removeViolinPlot () {
      $('#vplot_1-svg').remove()
    },
    clearExpressionData () {
      this.expressionData = null
      this.removeViolinPlot()
    },
    resetAll () {
      this.clearSelectedGene()
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
    getTissueInfo (dataset) {
      let tissueUrl = GTEX_API + 'dataset/tissueInfo?datasetId=' + GTEX_VER + '&format=json'
      let self = this
      axios.get(tissueUrl).then(function (r) { self.tissue_info = r.data.tissueInfo })
    },
    getGeneExpressionData (gencodeId) {
      // always request subsets and recombine later
      let subset = 'sex'
      let self = this
      let expnUrl = GTEX_API + 'expression/geneExpression?gencodeId=' + gencodeId
      if (subset) expnUrl += '&attributeSubset=' + subset
      expnUrl += this.gtexURLSuffix()
      axios.get(expnUrl).then(function (r) { self.setExpressionData(r.data.geneExpression) })
    },
    computeMedian (data) {
      data.sort(function (a, b) { return a - b })
      let dl = data.length
      let mp = Math.floor(dl / 2.0)
      if (dl % 2) {
        return data[mp]
      } else {
        return (data[mp - 1] + data[mp]) / 2.0
      }
    },
    setExpressionData (data) {
      let self = this

      // group by tissue
      let tissueGroups = []
      let t2tg = {}

      data.forEach(ed => {
        let tissue = ed['tissueSiteDetailId']
        if (!(tissue in t2tg)) {
          let tg = { 'tissueSiteDetailId': tissue, 'subsets': [] }
          t2tg[tissue] = tg
          tissueGroups.push(tg)
        }
        t2tg[tissue]['subsets'].push(ed)
      })

      // compute median
      tissueGroups.forEach(tg => {
        let allData = []
        tg['subsets'].forEach(ed => {
          ed['median'] = self.computeMedian(ed['data'])
          if (ed.subsetGroup) {
            tg['median-' + ed.subsetGroup] = ed['median']
            tg['count-' + ed.subsetGroup] = ed['data'].length
          }
          allData = allData.concat(ed['data'])
        })
        tg['data'] = allData
        tg['median'] = self.computeMedian(tg['data'])
      })

      // sort groups
      tissueGroups.sort(function (a, b) { return b['median'] - a['median'] })

      let topTissues = []
      let rank = 1
      tissueGroups.forEach(tg => {
        let ss1 = tg['subsets'][0]
        let t = self.detailId2tissue[ss1['tissueSiteDetailId']]
        let key = ss1['tissueSiteDetailId']
        let tt = { ...t,
          'tissueSiteDetailId': ss1['tissueSiteDetailId'],
          'tissue': t,
          'median': tg['median'].toFixed(2),
          'median-male': tg['median-male'] ? tg['median-male'].toFixed(2) : 'N/A',
          'median-female': tg['median-female'] ? tg['median-female'].toFixed(2) : 'N/A',
          'count': tg['data'].length,
          'count-male': tg['count-male'],
          'count-female': tg['count-female'],
          'key': key,
          'rank': rank++
        }
        topTissues.push(tt)
      })

      this.expressionData = tissueGroups.slice(0, this.numTopTissues)
      this.allExpressionData = tissueGroups
      this.topTissues = topTissues.slice(0, this.numTopTissues)
      this.allTissues = topTissues.sort(function (a, b) { return a.tissue.tissueSiteDetail.localeCompare(b.tissue.tissueSiteDetail) })
    },
    displayExpressionData () {
      this.removeViolinPlot()
      if (this.expressionData == null || this.tissue_info == null) return
      let expData = null

      if (this.showSelected) {
        // filter expression data by selected tissues
        if (this.selected.length === 0) return
        let selTissues = {}
        this.selected.forEach(s => { selTissues[s['tissueSiteDetailId']] = 1 })
        expData = this.allExpressionData.filter(d => d['tissueSiteDetailId'] in selTissues)
      } else {
        expData = this.expressionData
      }

      let self = this
      let units = expData[0]['subsets'][0]['unit']
      violinConfig.data = []
      violinConfig.showOutliers = this.show_outliers
      violinConfig.yLabel = self.log_scale ? 'log10(' + units + '+1)' : units
      violinConfig.scale = self.log_scale ? 'log' : 'linear'
      violinConfig.width = this.width / 2
      violinConfig.height = this.height - this.vpad

      expData.forEach(ed => {
        let t = self.detailId2tissue[ed['tissueSiteDetailId']]
        let subsetTissues = []
        ed['subsets'].forEach(ss => {
          let data = self.log_scale ? ss['data'].map(d => Math.log10(+d + 1)) : ss['data']
          let tissue = {
            'group': GTEX_VER,
            'label': t['tissueSiteDetail'],
            'values': data,
            'color': '#' + t['colorHex'],
            'fill-opacity': '0.5'
          }

          if (('subsetGroup' in ss) && (this.subset_by_sex)) {
            tissue['label'] = ss['subsetGroup']
            tissue['group'] = t['tissueSiteDetail']
            tissue['color'] = SUBSET_COLORS[ss['subsetGroup']]
          }
          subsetTissues.push(tissue)
        })
        // recombine data if not subsetting
        if (!this.subset_by_sex) {
          let combinedData = []
          subsetTissues.forEach(st => { if (st['values'] != null) { combinedData = combinedData.concat(st['values']) } })
          subsetTissues[0]['values'] = combinedData
          violinConfig.data.push(subsetTissues[0])
        } else {
          subsetTissues.forEach(st => violinConfig.data.push(st))
        }
      })
      GTExViz.groupedViolinPlot(violinConfig)
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
    selectTissuesFromQuery () {
      let selTissues = {}
      let uids = this.uberonIds !== null ? this.uberonIds.split(',') : []
      let tids = this.tissueSiteDetailIds !== null ? this.tissueSiteDetailIds.split(',') : []
      // UBERON ids
      uids.forEach(id => {
        let ts = this.uberon2tissues[id]
        ts.forEach(t => {
          if (!(t['tissueSiteDetailId'] in selTissues)) {
            selTissues[t['tissueSiteDetailId']] = t
            this.selected.push(t)
          }
        })
      })

      tids.forEach(id => {
        let t = this.detailId2tissue[id]
        if (!(t['tissueSiteDetailId'] in selTissues)) {
          selTissues[t['tissueSiteDetailId']] = t
          this.selected.push(t)
        }
      })

      // switch to display selected tissues only
      if ((uids.length + tids.length) > 0) {
        this.tissue_sel_mode = 'custom'
      }
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

<!-- doesn't work with 'scoped' - move this into external/sitewide CSS? -->
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
