<template>
  <v-container fluid fill-width class="ma-0 pa-0">

    <v-row v-if="!hideTitle" class="ma-0 pa-0">
      <v-col cols="12" class="ma-0 pa-0">
	<div style="background-color: #336699;">
          <span class="font-weight-bold white--text"><img src="static/CFDE-icon-1.png" style="height: 2rem;" class="pr-2"/>{{genomeVer}} transcripts for {{ sel_gencodeId }} - <span v-if="transcripts">{{ transcripts.length }} isoform(s)</span></span>
	  </div>
      </v-col>
    </v-row>

    <v-row class="ma-0 pa-0 pt-2">
      <v-col cols="6" class="ma-0 pa-0">

	<v-data-table
	  v-if="false"
	  v-model="selected"
	  :headers="headers"
	  :items="transcripts"
	  item-key="transcriptId"
	  dense
	  hide-default-footer
	  :height="height - vpad"
	  >
	  </v-data-table>
      </v-col>

      <v-col cols="12" class="ma-0 pa-0">
        <div v-if="sel_gencodeId" class="pa-0 ma-0">
          <div id='transcript_1' class="pa-0 ma-0" :height="height - vpad">
	  </div>
	</div>
      </v-col>
    </v-row>
  </v-container>
</template>

<script>

var GTEX_API = 'https://gtexportal.org/rest/v1/';
var GTEX_VER = 'gtex_v8';
var GTEX_VER_DESCR = 'GTEx v8';
var GENCODE_VER = 'v26';
var GENOME_VER = 'GRCh38/hg38';
var PAGE_SIZE = 250;
var VPAD = 15;
var TITLE_HEIGHT = 40;
var CONTROLS_HEIGHT = 30;

var SUBSET_COLORS = {
  'male' : '#aaeeff',
  'female' : '#ffaa99',
};

var DEFAULT_UBERON_IDS_TXT = 'UBERON:0002037,UBERON:0013756';

import axios from 'axios';

var transcripts_min_height = 100;
var transcript_height = 26;

var transcript_config = {
  id: 'transcript_1',
  data: null,
  width: 800,
  height: transcripts_min_height,
  marginLeft: 200,
  marginRight: 20,
  marginTop: 0,
  marginBottom: 20,
  labelPos: 'left'
};

export default {
  name: 'GeneTranscripts',
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
    hideTitle: {
      type: Number,
      required: false,
      default: 0,
    },
    hideControls: {
      type: Number,
      required: false,
      default: 0,
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
    sel_gencodeId(gid) {
      if (gid == null) {
        this.clearSelectedGene();
      } else {
        this.getGeneTranscriptsAndExons(gid);
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
    },
    transcripts(ts) {
      this.displayGeneStructure();
    },
    exons(es) {
      this.displayGeneStructure();
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
    vpad() {
      let vp = VPAD;
      if (!this.hideTitle) {
        vp += TITLE_HEIGHT;
       }
      if (!this.hideControls) {
        vp += CONTROLS_HEIGHT;
      }
      return vp;
    },
  },
  methods: {
    clearSelectedGene() {
      this.sel_gene = null;
      this.sel_gencodeId = null;
      this.sel_geneSymbol = null;
      this.sel_gene_index = null;
      this.transcripts = null;
      this.exons = null;
      $("#transcript_1-svg").remove();
    },
    resetAll() {
      this.clearSelectedGene();
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
      transcript_config['width'] = this.width;
      transcript_config['data'] = { 'transcripts': t_transcripts, 'exons': t_exons };
      GTExViz.transcriptTracks(transcript_config);
    },
    getTissueInfo(dataset) {
      let tissue_url = GTEX_API + "dataset/tissueInfo?datasetId=" + GTEX_VER + "&format=json"
      let self = this;
      axios.get(tissue_url).then(function(r) { self.tissue_info = r.data.tissueInfo; });
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

text {
    font-size: 14px !important;
    vertical-align: sub !important;
}    

</style>
