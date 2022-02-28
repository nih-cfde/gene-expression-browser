<template>
  <v-container fluid fill-width class="ma-0 pa-0">

    <v-row class="ma-0 pa-0">
      <v-col cols="12" class="ma-0 pa-0">
	<div style="background-color: #336699;">
          <span class="font-weight-bold white--text"><img src="static/CFDE-icon-1.png" style="height: 2rem;" class="pr-2"/>{{gtexVerDescr}} normalized expression data for top {{ numTopTissues }} tissues for {{ sel_gencodeId }}</span>
	  </div>
      </v-col>
    </v-row>

    <v-row class="ma-0 pa-0 pt-2">
      <v-col cols="6" class="ma-0 pa-0">

	<v-data-table
	  v-model="selected"
	  :headers="headers"
	  :items="top_tissues"
	  :items-per-page="numTopTissues"
	  item-key="tissueSiteDetailId"
	  dense
	  hide-default-footer
	  :height="height - vpad"
	  >

	  <template v-slot:item.tissueSiteDetail="{ item }">
	    <td class="text-xs-left">
	      <v-chip label small class="mr-2" :color="'#' + item.colorHex"></v-chip>
	      
	      <v-tooltip top color="primary">
		<template v-slot:activator="{ on: tooltip }">
		  <span v-on="{ ...tooltip }">
		    {{ item.tissueSiteDetail }}
		  </span>
		</template>
		<span>{{ item.samplingSite }}</span>
	      </v-tooltip>
	    </td>

	  </template>

	  </v-data-table>
      </v-col>

      <v-col cols="6" class="ma-0 pa-0">

	<!--
        <div v-if="sel_gencodeId" class="pt-2 mt-4 pl-3">
  	  <h4 class="pa-0 ma-0">{{genomeVer}} Transcripts:</h4>
  	  <div id="transcript_1" :style="'height: ' + transcriptsHeight + 'px'"></div>
	</div>
	-->
	
        <div v-if="sel_gencodeId" class="pa-0 ma-0">
          <div id='vplot_1'></div>
       </div>
      </v-col>
    </v-row>
  </v-container>
</template>

<script>
// <-- color="#c3e1e6" -->

var GTEX_API = 'https://gtexportal.org/rest/v1/';
var GTEX_VER = 'gtex_v8';
var GTEX_VER_DESCR = 'GTEx v8';
var GENCODE_VER = 'v26';
var GENOME_VER = 'GRCh38/hg38';
var PAGE_SIZE = 250;
var VPAD = 50;

var SUBSET_COLORS = {
  'male' : '#aaeeff',
  'female' : '#ffaa99',
};

var DEFAULT_UBERON_IDS_TXT = 'UBERON:0002037,UBERON:0013756';

import axios from 'axios';

var transcripts_min_height = 100;
var transcript_height = 22;

var transcript_config = {
  id: 'transcript_1',
  data: null,
  width: 800,
  height: transcripts_min_height,
  marginLeft: 120,
  marginRight: 20,
  marginTop: 0,
  marginBottom: 20,
  labelPos: 'left'
};

var violin_config = {
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
  showSampleSize: false,
};

export default {
  name: 'ViolinPlot',
  props: {
    gencodeId: {
      type: String,
      required: true,
      default: undefined,
    },
    width: {
      type: Number,
      required: false,
      default: 1000,
    },
    height: {
      type: Number,
      required: false,
      default: 600,
    },
    numTopTissues: {
      type: Number,
      required: false,
      default: 10,
    },
  },
  data() {
    return {
      gtexAPI: GTEX_API,
      gtexVer: GTEX_VER,
      gtexVerDescr: GTEX_VER_DESCR,
      gencodeVer: GENCODE_VER,
      genomeVer: GENOME_VER,
      pageSize: PAGE_SIZE,
      vpad: VPAD,

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
      log_scale: false,

      // table of tissues with the highest expression
      top_tissues: [],
      selected: [],
      headers: [
        {
          text: 'tissue',
          value: 'tissueSiteDetail',
          class: 'text-subtitle-1 font-weight-bold',
        },
        {
          text: 'median TPM',
          value: 'median',
          class: 'text-subtitle-1 font-weight-bold',
        },
        {
          text: 'samples',
          value: 'count',
          class: 'text-subtitle-1 font-weight-bold',
        },

       ],
      };
  },
  watch: {
    // gene search string reset
    gene_ss(ng) {
      if ((ng == null) || (ng == '')) {
        this.clearSearchResults();
      }
    },
    sel_gencodeId(gid) {
      if (gid == null) {
        this.clearSelectedGene();
      } else {
        this.getGeneTranscriptsAndExons(gid);
        if (this.uberon2tissues) { this.getGeneExpressionData(gid); }
      }
    },
    sel_gene_index(ind) {
      if (ind != null) {
        this.clearSelectedGene();
        this.sel_gene = this.gene_ss_results[ind];
        this.sel_gencodeId = this.gene_ss_results[ind].gencodeId;
        this.sel_geneSymbol = this.gene_ss_results[ind].geneSymbolUpper;
      }
    },
    // index tissues by UBERON id and tissueSiteDetailId
    tissue_info(ti) {
      let ut = {};
      let dt = {};
      ti.forEach(t => {
        let key = 'UBERON:' + t['uberonId'];
        // mapping is not quite 1-1
        if (key in ut) {
          ut[key].push(t);
        } else {
          ut[key] = [t];
        }
        dt[t['tissueSiteDetailId']] = t;
      });
      this.uberon2tissues = ut;
      this.detailId2tissue = dt;
      if (this.sel_gencodeId) { this.getGeneExpressionData(this.sel_gencodeId); }
    },
    transcripts(ts) {
      this.displayGeneStructure();
    },
    exons(es) {
      this.displayGeneStructure();
    },
    expression_data(ed) {
     this.displayExpressionData();
    },
    subset_by_sex(ss) {
      this.clearExpressionData();
      this.getGeneExpressionData(this.sel_gencodeId);
    },
    show_outliers(so) {
      this.clearExpressionData();
      this.getGeneExpressionData(this.sel_gencodeId);
    },
    log_scale(so) {
      this.clearExpressionData();
      this.getGeneExpressionData(this.sel_gencodeId);
    },
    uberon_ids_txt(nt) {
      let ids = nt.split(/\s*,\s*/);
      this.uberon_ids = ids;
    },
  },
  mounted() {
    this.getTissueInfo(GTEX_VER);
      this.clearSelectedGene();
      const pr = this.getGeneInfo(this.gencodeId);
      let self = this;
      pr.then(function(res) {
        if (res['data']['gene']) {
          self.sel_gencodeId = res['data']['gene'][0]['gencodeId'];
        }
      });
  },
  computed: {
    transcriptsHeight() {
      let height = transcripts_min_height;
      if (this.transcripts) {
        let cheight = this.transcripts.length * transcript_height;
        if (cheight > height) height = cheight;
      }
      return height;
    },
  },
  methods: {
    clearSearchResults() {
      this.clearSelectedGene();
      this.gene_ss_results = [];
    },
    clearSelectedGene() {
      this.sel_gene = null;
      this.sel_gencodeId = null;
      this.sel_geneSymbol = null;
      this.sel_gene_index = null;
      this.transcripts = null;
      this.exons = null;
      this.clearExpressionData();
//      $("#transcript_1-svg").remove();
    },
    clearExpressionData() {
      this.expression_data = null;
      $("#vplot_1-svg").remove();
    },
    searchClicked() {
      this.clearSelectedGene();
      const pr = this.getGeneInfo(this.gene_ss);
      let self = this;
      pr.then(function(res) {
        if (res['data']['gene']) {
          self.gene_ss_results = res['data']['gene'];
        }
      });
    },
    resetAll() {
      this.clearSelectedGene();
      this.gene_ss = '';
      this.uberon_ids_txt = this.default_uberon_ids_txt;
    },
    gtexURLSuffix(datasetId, pageSize, format) {
      var suffix ="&gencodeVersion=" + GENCODE_VER + "&genomeBuild=" + encodeURIComponent(GENOME_VER);
      if (datasetId) suffix += "&datasetId=" + datasetId;
      if (pageSize) suffix += "&pageSize=" + pageSize;
      if (format) suffix += "&format=" + format;
      return suffix;
    },
    getGeneInfo(search_str) {
      let gene_url = GTEX_API + "reference/gene?geneId=" + search_str + this.gtexURLSuffix(GTEX_VER, PAGE_SIZE, 'json');
      return axios.get(gene_url);
    },
    getGeneTranscripts(gencodeId) {
      let trans_url = GTEX_API + "reference/transcript?gencodeId=" + gencodeId + this.gtexURLSuffix();
      return axios.get(trans_url);
    },
    getGeneExons(gencodeId) {
      let exon_url = GTEX_API + "reference/exon?gencodeId=" + gencodeId + this.gtexURLSuffix();
      return axios.get(exon_url);
    },
    getGeneTranscriptsAndExons(gencodeId) {
      let self = this;
      this.getGeneTranscripts(gencodeId).then(function(r) { self.transcripts = r.data.transcript; } );
      this.getGeneExons(gencodeId).then(function(r) { self.exons = r.data.exon; } );
    },
    displayGeneStructure() {
      if ((this.transcripts == null) || (this.exons == null)) return;
      let t2exons = {};
      this.exons.forEach(e => {
        let tid = e.transcriptId;
        if (!(tid in t2exons)) {
          t2exons[tid] = [];
        }
        t2exons[tid].push({
          "chrom": e.chromosome.replace('chr',''),
          "chromEnd": e.end,
          "exonId": e.exonId,
          "exonNumber": e.exonNumber,
          "chromStart": e.start,
          "strand": e.strand
        });
      });

      // display all transcripts
      let t_transcripts = this.transcripts;
      let t_exons = {};
      Object.keys(t2exons).forEach(k => {
        t_exons[k] = t2exons[k];
      });

      let nt = t_transcripts.length;
      transcript_config['height'] = this.transcriptsHeight;
      transcript_config['data'] = { 'transcripts': t_transcripts, 'exons': t_exons };
//      GTExViz.transcriptTracks(transcript_config);
    },
    getTissueInfo(dataset) {
      let tissue_url = GTEX_API + "dataset/tissueInfo?datasetId=" + GTEX_VER + "&format=json"
      let self = this;
      axios.get(tissue_url).then(function(r) { self.tissue_info = r.data.tissueInfo; });
    },
    getGeneExpressionData(gencodeId) {
      let subset = (this.subset_by_sex) ? 'sex' : null;
      let self = this;
      let expn_url = GTEX_API + "expression/geneExpression?gencodeId=" + gencodeId;
      if (subset) expn_url += "&attributeSubset=" + subset;
      expn_url += this.gtexURLSuffix();
      axios.get(expn_url).then(function(r) { self.setExpressionData(r.data.geneExpression); });
    },
    setExpressionData(data) {
      // compute median and sort
      data.forEach(ed => {
        ed['data'].sort(function(a,b) { return a - b;})
        let dl = ed['data'].length;
        let mp = Math.floor(dl / 2.0);
        if (dl % 2) {
          ed['median'] = ed['data'][mp];
        } else {
          ed['median'] = (ed['data'][mp-1] + ed['data'][mp]) / 2.0;
        }
      });

      let self = this;
      let sorted_data = data.slice();
      sorted_data.sort(function(a,b) {return b['median'] - a['median']});

      let top_tissues = [];
      sorted_data.forEach(ed => {
        let t = self.detailId2tissue[ed['tissueSiteDetailId']];
        let tt = { ...t,
                   'tissueSiteDetailId': ed['tissueSiteDetailId'],
                   'median': ed['median'].toFixed(2),
                   'count': ed['data'].length,
                 };
        top_tissues.push(tt);
      });

      this.expression_data = sorted_data.slice(0,this.numTopTissues);
      this.top_tissues = top_tissues;
    },
    displayExpressionData() {
      if (this.expression_data == null || this.tissue_info == null) return;
      let self = this;
      let units = this.expression_data[0]['unit'];
      violin_config.data = [];
      violin_config.showOutliers = this.show_outliers;
      violin_config.yLabel = self.log_scale ? 'log10(' + units + '+1)' : units;
      violin_config.scale = self.log_scale ? 'log' : 'linear';
      violin_config.width = this.width / 2;
      violin_config.height = this.height - this.vpad;

      this.expression_data.forEach(ed => {
        let t = self.detailId2tissue[ed['tissueSiteDetailId']];
        let data = self.log_scale ? ed['data'].map(d => Math.log10(+d+1)) : ed['data'];
        let tissue = {
          'group': GTEX_VER,
          'label': t['tissueSiteDetail'],
          'values': data,
          'color': '#' + t['colorHex'],
          'fill-opacity': '0.5'
        };

        if ('subsetGroup' in ed) {
          tissue['label'] = ed['subsetGroup'];
          tissue['group'] = t['tissueSiteDetail'];
          tissue['color'] = SUBSET_COLORS[ed['subsetGroup']];
        }
        violin_config.data.push(tissue);
      });
      GTExViz.groupedViolinPlot(violin_config);
    },
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
