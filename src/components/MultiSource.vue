<template>
  <v-container fluid fill-width class="ma-0 pa-0">

    <v-row class="ma-0 pa-0">
      <v-col cols="12" class="ma-0 pa-0">
        <v-app-bar class="ma-0 pa-0" color="#336699">
          <v-toolbar-title class="text-h5 ma-0 pa-0 text-white"><img src="static/CFDE-icon-1.png" style="height: 2rem;" class="pr-2"/>CFDE Multi-Source Gene Expression Browser Prototype</v-toolbar-title>
        </v-app-bar>
      </v-col>
    </v-row>

    <v-row class="ma-0 pa-0 mt-1 mr-3">
      <v-col cols="3" class="ma-0 pa-2 pt-4">

        <h4 class="lh_head">Data Sources</h4>
        <v-list class="ml-2" dense>
          <v-list-item>
            <v-list-item-action>
              <v-checkbox v-model="source_gtex"></v-checkbox>
            </v-list-item-action>
            <v-list-item-content>
              GTEx v8
            </v-list-item-content>
          </v-list-item>

          <v-list-item disabled>
            <v-list-item-action>
              <v-checkbox v-model="source_kidsfirst"></v-checkbox>
            </v-list-item-action>
            <v-list-item-content>
              KidsFirst
            </v-list-item-content>
          </v-list-item>

          <v-list-item>
            <v-list-item-action>
              <v-checkbox v-model="source_recount3"></v-checkbox>
            </v-list-item-action>
            <v-list-item-content>
              Recount3 - GTEx v8
            </v-list-item-content>
          </v-list-item>

          <v-list-item disabled>
            <v-list-item-action>
              <v-checkbox v-model="source_motrpac"></v-checkbox>
            </v-list-item-action>
            <v-list-item-content>
              MoTrPAC
            </v-list-item-content>
          </v-list-item>
        </v-list>

        <h4 class="lh_head">Gene Search</h4>
        <v-text-field
          v-model="gene_ss"
          v-on:keyup.enter="searchClicked"
          label="Enter gene id e.g., MYLK, PTEN, BRCA"
          clearable
          clear-icon="mdi-close-circle"
          solo
          class="pa-0 ma-0 pt-2 ml-2"
          ></v-text-field>
        <v-btn v-on:click="searchClicked" :disabled="gene_ss == null || gene_ss == ''" class="ml-2">search</v-btn>

<!--    <h4 class="mt-4 pt-2 ml-2">Search results ({{ gene_ss_results.length }}):</h4> -->
        <v-list class="ml-2">
          <v-list-item-group v-model="sel_gene_index">
            <v-list-item v-for="(item, i) in gene_ss_results" :key="i">
              <v-list-item-avatar>
                <v-tooltip v-if="item.geneType == 'protein coding'" top>
                  <template v-slot:activator="{ on: tooltip }"><v-chip v-on="{ ...tooltip }" color="#61cc7e">P</v-chip></template>
                  <span>protein coding gene</span>
                </v-tooltip>

                <v-tooltip v-else-if="item.geneType.endsWith('unprocessed pseudogene')" top>
                  <template v-slot:activator="{ on: tooltip }"><v-chip v-on="{ ...tooltip }" color="#ffd0d0">U</v-chip></template>
                  <span>{{ item.geneType }}</span>
                </v-tooltip>

                <v-tooltip v-else-if="item.geneType.endsWith('processed pseudogene')" top>
                  <template v-slot:activator="{ on: tooltip }"><v-chip v-on="{ ...tooltip }" color="#ffd0d0">Ps</v-chip></template>
                  <span>{{ item.geneType }}</span>
                </v-tooltip>

                <v-tooltip v-else-if="item.geneType == 'antisense'" top>
                  <template v-slot:activator="{ on: tooltip }"><v-chip v-on="{ ...tooltip }" color="#d0d0ff">A</v-chip></template>
                  <span>{{ item.geneType }}</span>
                </v-tooltip>

                <v-tooltip v-else top>
                  <template v-slot:activator="{ on: tooltip }"><v-chip v-on="{ ...tooltip }" color="#e0e0e0">?</v-chip></template>
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

      <v-col cols="9" class="ma-0 pa-2">

        <!-- 2 x 2 layout of data sources -->

        <v-container class="ma-0 pa-0 ml-3">
          <v-row class="ma-0 pa-0">

            <v-col cols="6" class="ma-0 pa-2">
              <div class="dframe ma-1 pa-0 mt-0">
                <div class="dframe_title pa-1 pl-3 pt-2"><h4>GTEx v8</h4></div>
                <div id='gtex_1' class="vplot"></div>
              </div>
            </v-col>

            <v-col cols="6" class="ma-0 pa-2">
              <div class="dframe ma-1 pa-0 mt-0">
                <div class="dframe_title pa-1 pl-3 pt-2"><h4>KidsFirst</h4></div>
                <div id='kidsfirst_1' class='vplot'></div>
              </div>
            </v-col>
          </v-row>

          <v-row class="ma-0 pa-0">
            <v-col cols="6" class="ma-0 pa-2">
              <div class="dframe ma-1 pa-0">
                <div class="dframe_title pa-1 pl-3 pt-2"><h4>Recount3 - GTEx</h4></div>
                <div id='recount3_1' class='vplot'></div>
              </div>
            </v-col>

            <v-col cols="6" class="ma-0 pa-2">
              <div class="dframe ma-1 pa-0">
                <div class="dframe_title pa-1 pl-3 pt-2"><h4>MoTrPAC</h4></div>
                <div id='motrpac_1' class='vplot'></div>
              </div>
            </v-col>
          </v-row>
        </v-container>

      </v-col>
    </v-row>

  </v-container>
</template>

<script>
// GTEx
var GTEX_API = 'https://gtexportal.org/rest/v1/'
var GTEX_VER = 'gtex_v8'
var GENCODE_VER = 'v26'
var GENOME_VER = 'GRCh38/hg38'
var PAGE_SIZE = 250

// Snaptron/Recount
//var RECOUNT_GTEX_API = 'http://snaptron.cs.jhu.edu/gtex/'
var RECOUNT_GTEX_API = 'http://127.0.0.1/snaptron/gtex/'

var SUBSET_COLORS = {
  'male' : '#aaeeff',
  'female' : '#ffaa99',
}

var SOURCES = ['gtex', 'kidsfirst', 'recount3', 'motrpac']

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

import axios from 'axios';

var violin_config_default = {
  data: null,
  width: 600,
  height: 440,
  marginLeft: 120,
  marginRight: 80,
  marginTop: 30,
  marginBottom: 120,
  showDivider: false,
  xPadding: 0.1,
  yLabel: null,
  showGroupX: true,
  showX: true,
  xAngle: 30,
  showWhisker: false,
  showLegend: false,
  showSampleSize: false,
};

export default {
  name: 'ViolinPlot',
  props: {
  },
  data() {
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

      // violin plot configuration
      violin_configs: {},

      // gencodeId of selected gene
      sel_gencodeId: null,
      sel_geneSymbol: null,
      sel_gene: null,

      // tissue info
      tissue_info: null,
      uberon2tissues: null,
      detailId2tissue: null,
//      uberon_ids: ['UBERON:0002037', 'UBERON:0013756'], // cerebellum, venous blood
      uberon_ids: ['UBERON:0013756'], // cerebellum, venous blood

      // gene expression data
      exp_gencodeId: null,
      gtex_expression_data: null,
      recount_expression_data: null,
      recount_tissue: null,
      recount_tissue_color_hex: null,

      subset_by_sex: false,
      show_outliers: true,
      log_scale: false,

      // toggle data sources
      source_gtex: true,
      source_kidsfirst: false,
      source_recount3: true,
      source_motrpac: false,
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
    gtex_expression_data(ed) {
     this.displayGTExExpressionData();
    },
    recount_expression_data(ed) {
     this.displayRecountExpressionData();
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
    }
  },
  mounted() {
    this.initConfigs();
    this.getTissueInfo(GTEX_VER);
  },
  computed: {
  },
  methods: {
    initConfigs() {
      SOURCES.forEach(s => {
        this.violin_configs[s] = { ...violin_config_default };
        this.violin_configs[s]['id'] = s + "_1";
      });
    },
    clearSearchResults() {
      this.clearSelectedGene();
      this.gene_ss_results = [];
    },
    clearSelectedGene() {
      this.sel_gene = null;
      this.sel_gencodeId = null;
      this.sel_geneSymbol = null;
      this.sel_gene_index = null;
      this.clearExpressionData();
    },
    clearExpressionData() {
      this.gtex_expression_data = null;
      $("#gtex_1-svg").remove();
      this.recount_expression_data = null;
      $("#recount3_1-svg").remove();
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
    getTissueInfo(dataset) {
      let tissue_url = GTEX_API + "dataset/tissueInfo?datasetId=" + GTEX_VER + "&format=json"
      let self = this;
      axios.get(tissue_url).then(function(r) { self.tissue_info = r.data.tissueInfo; });
    },
    getGeneExpressionData(gencodeId) {
      let subset = (this.subset_by_sex) ? 'sex' : null;
      let tissues = [];
      let self = this;
      // look up UBERON ids
      this.uberon_ids.forEach(ui => {
        tissues = tissues.concat(self.uberon2tissues[ui]);
      });

      if (tissues.length == 0) return;

      // GTEx v8
      let tissues_str = "&tissueSiteDetailId=" + encodeURIComponent(tissues.map(t => t['tissueSiteDetailId']).join(","));
      let gtex_url = GTEX_API + "expression/geneExpression?gencodeId=" + gencodeId + tissues_str;
      if (subset) gtex_url += "&attributeSubset=" + subset;
      gtex_url += this.gtexURLSuffix();
      this.exp_gencodeId = gencodeId;
      axios.get(gtex_url).then(function(r) {
        self.gtex_expression_data = r.data.geneExpression;
      });

      // Snaptron/Recount3
      // TODO - map each tissueSiteDetail value to rail ids
      console.log("got tissues = " + tissues.map(t => t.tissueSiteDetail));

      // DEBUG
      // Whole Blood / female
      let wb_female_rids = [50158,50165,50169,50624,50663,50422,51534,51591,50530,50254,51110,52062,52162,52164,52188,52353,52369,52386,52401,52454,51824,51929,52745,52841,51768,51781,51782,51788,51790,50922,56562,56599,56620,56635,56434,56465,56272,56010,55794,55521,55556,55583,56752,55630,55667,55680,55683,52203,53325,53333,53337,53784,53862,53709,54032,54044,54054,54122,52854,52883,53470,53590,53592,53594,53613,54023,52997,53006,53016,53019,53021,53031,53048,55365,55448,55451,55245,55320,55325,54344,54348,54351,54352,54427,54210,54887,54931,54934,54664,54680,54688,54775,54816,54818,54823,55116,54501,54535,54958,54995,55000,55068,55888,55908,55966,55972,57520,57211,57242,57272,57307,57319,57353,57366,57112,57167,57688,56830,56907,57861,57865,57875,57898,57913,57935,57012,57038,57805,58897,58524,58817,58818,58826,58846,58869,58877,58430,58492,59044,59047,59117,59120,58238,58243,58245,58316,58009,58192,58204,58208,58211,59332,59360,59367,59394,59402,59410,59453,59517,59562,59585,59587,59634,59644,59654];
      let wb_male_rids = [51341,51388,51399,51407,50138,50146,50186,50214,50642,50644,50645,50670,50676,50741,50742,51150,51151,51153,51164,51199,51235,50365,50438,50447,51434,51466,50759,50782,50795,50799,50851,51548,51667,50511,50520,50546,50569,50580,50617,50249,50337,51071,51092,51093,51131,51144,52067,52068,52070,52074,52125,52141,52146,52354,52359,52376,52432,52433,51951,51956,52045,52691,51807,51810,51845,52744,52785,52796,52801,52845,51737,51742,51752,51753,51762,51765,51772,52466,52474,52490,56200,56233,56254,56542,56582,56586,56656,56443,56500,56318,56334,56387,56001,56108,56116,55831,55513,55585,55597,56705,56711,56728,56769,55648,55658,55663,55666,55673,55724,52254,52277,53167,53171,53322,53326,53328,53345,53354,53361,53822,53672,53674,53720,53749,54039,54055,54084,54096,54114,52886,52916,52930,53386,53399,53429,53477,53514,53515,53976,53997,52999,53035,53054,55436,55474,55475,55222,55255,55265,55270,55276,55279,55281,55289,55309,55311,55324,55329,55344,54312,54324,54347,54369,54399,54178,54291,54896,54925,54607,54609,54641,54655,54671,54678,54694,54708,54718,54737,54765,54802,54820,55206,54438,54451,54479,54538,54998,55005,55900,55910,55918,55939,55981,55991,57502,57509,57526,57537,57539,57544,57548,57552,57564,57189,57196,57203,57206,57222,57250,57251,57269,57308,57356,57445,57609,57626,57660,57678,57710,56888,57848,57852,57871,57873,57887,57888,57889,57891,57925,57927,57964,57003,57025,57759,57799,57837,58907,58940,58968,58498,58500,58528,58546,58558,58565,58567,58570,58837,58848,58857,58858,59203,59207,59210,59220,58386,58420,58460,58474,58486,58490,59067,59097,59098,59122,59126,58246,58007,58037,58170,58678,58693,58713,59304,59359,59439,59459,59482,59496,59507,59522,59523,59526,59535,59561,59594,59611,59679,59684,59695,59720];

// TODO - add queries for male_rids
// TODO - add queries for all tissues

      let recount_url = 'http://127.0.0.1/snaptron/gtex/genes?regions=' + gencodeId + '&sids=' + wb_female_rids.join(",");
      axios.get(recount_url).then(function(r) {
        self.recount_tissue = tissues[0]['tissueSiteDetail'];;
        self.recount_tissue_color_hex = tissues[0]['colorHex'];
        self.recount_expression_data = r.data;
      });

    },
    displayGTExExpressionData() {
      if (this.gtex_expression_data == null || this.tissue_info == null) return;
      let self = this;
      let units = this.gtex_expression_data[0]['unit'];
      let violin_config = this.violin_configs['gtex'];
      violin_config.data = [];
      violin_config.showOutliers = this.show_outliers;
      violin_config.yLabel = self.log_scale ? 'log10(' + units + '+1)' : units;
      violin_config.scale = self.log_scale ? 'log' : 'linear';

      this.gtex_expression_data.forEach(ed => {
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
        this.violin_configs['gtex'].data.push(tissue);
      });
      GTExViz.groupedViolinPlot(this.violin_configs['gtex']);
    },

    // fields in tab-delimited Snaptron response:
    //DataSource:Type	snaptron_id	chromosome	start	end	length	strand	NA	NA	NA	exon_count	gene_id:gene_name:gene_type:bp_length	samples	samples_count	coverage_sum	coverage_avg	coverage_median	compilation_id
    displayRecountExpressionData() {
      if (this.recount_expression_data == null || this.tissue_info == null) return;
      let units = 'raw count';
      let self = this;
      let violin_config = this.violin_configs['recount3'];
      violin_config.data = [];
      violin_config.showOutliers = this.show_outliers;
      violin_config.yLabel = self.log_scale ? 'log10(' + units + '+1)' : units;
      violin_config.scale = self.log_scale ? 'log' : 'linear';

      // parse data
      let lines = this.recount_expression_data.split("\n");
      lines.filter(l => l != "").forEach(l => {
        let fields = l.split("\t");
        let gene_ids = fields[11].split(":");
        if (gene_ids[0] == 'gene_id') {
          // header line
        } else if (gene_ids[0] == this.exp_gencodeId) {
          let samples = fields[12];
          let sample_counts = samples.split(",");
          let data = [];
          sample_counts.forEach(sc => {
            if (sc != "") {
              let fs = sc.split(":");
              data.push(fs[1] * 1.0);
            }
          });

          let tissue = {
            'group': 'Recount3',
            'label': self.recount_tissue,
            'values': data,
            'color': '#' + self.recount_tissue_color_hex,
            'fill-opacity': '0.5'
          };
          violin_config.data.push(tissue);
        } else {
          console.log("read additional gene " + gene_ids[0]);
        }
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

div.dframe {
  border: 1px solid #a0a0a0;
  border-radius: 3px;
  background-color: #336699;
  color: #ffffff;
}

div.dframe_title {
  width: 100%;
}

div.vplot {
  width: 100%;
  height: 440px;
  background-color: #fbfbff;
}

h4.lh_head {
  border-top: 4px solid #336699;
  padding-top: 0.75em;
  padding-bottom: 0em;
}

</style>
