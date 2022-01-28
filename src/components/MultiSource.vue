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
              <span>GTEx v8 <v-chip color="#336699" class="dense text-white font-weight-medium ml-3">Common Fund</v-chip></span>
            </v-list-item-content>
          </v-list-item>

          <v-list-item>
            <v-list-item-action>
              <v-checkbox v-model="source_motrpac"></v-checkbox>
            </v-list-item-action>
            <v-list-item-content>
              <span>MoTrPAC <v-chip color="#336699" class="dense text-white font-weight-medium ml-3">Common Fund</v-chip></span>
            </v-list-item-content>
          </v-list-item>

          <v-list-item>
            <v-list-item-action>
              <v-checkbox v-model="source_recount3"></v-checkbox>
            </v-list-item-action>
            <v-list-item-content>
              <span>Recount3 - GTEx</span>
            </v-list-item-content>
          </v-list-item>

          <v-list-item disabled>
            <v-list-item-action>
              <v-checkbox v-model="source_kidsfirst"></v-checkbox>
            </v-list-item-action>
            <v-list-item-content>
              <span>KidsFirst <v-chip disabled color="#336699" class="dense text-white font-weight-medium ml-3">Common Fund</v-chip></span>
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
            <v-list-item v-for="(item, i) in gene_ss_results.slice(0, max_gene_results)" :key="i">
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

	  <v-list-item v-if="gene_ss_results.length > max_gene_results">
	    <v-list-item-content>
	      <span class="font-italic">{{ gene_ss_results.length - max_gene_results }} additional result(s) not shown</span>
	    </v-list-item-content>
	  </v-list-item>

	</v-list>

        <h4 class="lh_head">Tissue</h4>
        <v-radio-group v-model="sel_tissue" class="ml-2">
	  <v-radio v-for="(item, i) in tissues" :key="i" :label="item.uberon_id + ' - ' +  item.name" :value="item">
	  </v-radio>
	</v-radio-group>	  
	
      </v-col>

      <v-col cols="9" class="ma-0 pa-2">

        <!-- 2 x 2 layout of data sources -->

        <v-container class="ma-0 pa-0 ml-3">
          <v-row class="ma-0 pa-0">

            <v-col cols="6" class="ma-0 pa-2">
              <div class="dframe ma-1 pa-0 mt-0">
                <div class="dframe_title pa-1 pl-3 pt-2">
		  <h4>GTEx v8</h4>
		  <h6>{{ sel_gene ? sel_gene.gencodeId + " | " + sel_gene.geneSymbolUpper : "no gene selected" }}</h6>
		</div>
                <div id='gtex_1' class="vplot">
		  <v-progress-circular v-if="gtex_loading" indeterminate color="primary" class="ma-4"></v-progress-circular>
		  <v-alert v-else-if="gtex_error" type="warning">{{ gtex_error }}</v-alert>
		</div>
		<div class="dframe_footer pa-1 pl-3"><span class="font-italic">API:</span> {{ gtexAPI }}</div>
              </div>
            </v-col>

            <v-col cols="6" class="ma-0 pa-2">
              <div class="dframe ma-1 pa-0 mt-0">
                <div class="dframe_title pa-1 pl-3 pt-2">
		  <h4>MoTrPAC</h4>
		  <h6>{{ motrpacTitle }}</h6>
		</div>
                <div id='motrpac_1' class='vplot'>
		  <v-progress-circular v-if="motrpac_loading" indeterminate color="primary" class="ma-4"></v-progress-circular>
		  <v-alert v-else-if="motrpac_error" type="warning">{{ motrpac_error }}</v-alert>
		</div>
		<div class="dframe_footer pa-1 pl-3"><span class="font-italic">source:</span>Ensembl orthologs, flat file MoTrPAC data</div>
              </div>
            </v-col>
          </v-row>

          <v-row class="ma-0 pa-0">
            <v-col cols="6" class="ma-0 pa-2">
              <div class="dframe ma-1 pa-0">
                <div class="dframe_title pa-1 pl-3 pt-2">
		  <h4>Recount3 - GTEx</h4>
		  <h6>{{ sel_gene ? sel_gene.gencodeId + " | " + sel_gene.geneSymbolUpper : "no gene selected" }}</h6>
		</div>
		<div id='recount3_1' class='vplot'>
		  <v-progress-circular v-if="recount_loading" indeterminate color="primary" class="ma-4"></v-progress-circular>
		  <v-alert v-else-if="recount_error" type="warning">{{ recount_error }}</v-alert>
		</div>
		<div class="dframe_footer pa-1 pl-3"><span class="font-italic">API:</span> http://snaptron.cs.jhu.edu/gtex/</div>
              </div>
            </v-col>

            <v-col cols="6" class="ma-0 pa-2">
              <div v-if="source_kidsfirst" class="dframe ma-1 pa-0">
                <div class="dframe_title pa-1 pl-3 pt-2">
		  <h4>KidsFirst</h4>
		  <h6>{{ "no gene selected" }}</h6>
		</div>
                <div id='kidsfirst_1' class='vplot'>
		  <v-progress-circular v-if="kidsfirst_loading" indeterminate color="primary" class="ma-4"></v-progress-circular>
		  <v-alert v-else-if="kidsfirst_error" type="warning">{{ kidsfirst_error }}</v-alert>
		</div>
		<div class="dframe_footer pa-1 pl-3"><span class="font-italic">source:</span> no data available</div>
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
//var GTEX_API = 'http://127.0.0.1/gtex/rest/v1/'
var GTEX_VER = 'gtex_v8'
var GENCODE_VER = 'v26'
var GENOME_VER = 'GRCh38/hg38'
var PAGE_SIZE = 250

// Snaptron/Recount
//var RECOUNT_GTEX_API = 'http://snaptron.cs.jhu.edu/gtex/'
var RECOUNT_GTEX_API = 'http://127.0.0.1/snaptron/gtex/'

// Ensembl
var ENSEMBL_API = 'https://rest.ensembl.org/'

// MoTrPAC
var MOTRPAC_API = 'http://127.0.0.1:5000'

var SUBSET_COLORS = {
  'male' : '#aaeeff',
  'female' : '#ffaa99',
}

var SOURCES = ['gtex', 'recount3', 'motrpac', 'kidsfirst']

var TISSUES = [
  { 'name':'venous blood', 'uberon_id': 'UBERON:0013756', 'motrpac': 'blood_rna', 'color_hex': 'ff00bb' }, // gtex = venous blood
  { 'name':'right lobe of liver', 'uberon_id': 'UBERON:0001114', 'motrpac': 'liver', 'color_hex': 'aabb66' }, // gtex = liver
  { 'name':'left ventricle myocardium', 'uberon_id': 'UBERON:0006566', 'motrpac': 'heart', 'color_hex': '660099' }, // gtex = heart - left ventricle
  { 'name':'subcutaneous adipose tissue', 'uberon_id': 'UBERON:0002190', 'motrpac': 'white_adipose', 'color_hex': 'ff6600' }, // gtex = adipose tissue
  { 'name':'gastrocnemius medialis', 'uberon_id': 'UBERON:0011907', 'motrpac': 'gastrocnemius', 'color_hex': 'aaaaff' }, // gtex = muscle - skeletal
]

import axios from 'axios';
import recount_map from './recount_map.js';

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

      recountGtexAPI: RECOUNT_GTEX_API,

      ensemblAPI: ENSEMBL_API,

      motrpacAPI: MOTRPAC_API,

      tissues: TISSUES,
      sel_tissue: TISSUES[0],

      // gene search string
      gene_ss: '',
      gene_ss_results: [],
      sel_gene_index: null,
      max_gene_results: 5,

      // violin plot configuration
      violin_configs: {},

      // selected gene (gencodeId = ENGS id, geneSymbolUpper = gene symbol)
      sel_gene: null,

      // homologous rat genes for MoTrPAC
      rat_homologs: null,

      // tissue info
      tissue_info: null,
      uberon2tissues: null,
      detailId2tissue: null,

      // gene expression data
      exp_gene: null,
      gtex_expression_data: null,
      recount_expression_data: null,
      recount_tissue: null,
      recount_tissue_color_hex: null,
      motrpac_expression_data: null,
      gtex_loading: false,
      gtex_error: null,
      recount_loading: false,
      recount_error: null,
      motrpac_loading: false,
      motrpac_error: null,
      kidsfirst_loading: false,
      kidsfirst_error: null,

      subset_by_sex: false,
      show_outliers: true,
      log_scale: false,

      // toggle data sources
      source_gtex: true,
      source_kidsfirst: false,
      source_recount3: true,
      source_motrpac: true,
   };
  },
  watch: {
    // gene search string reset
    gene_ss(ng) {
      if ((ng == null) || (ng == '')) {
        this.clearSearchResults();
      }
    },
    sel_gene(gene) {
      if (gene == null) {
        this.clearSelectedGene();
      } else {
        if (this.uberon2tissues) { this.getGeneExpressionData(gene); }
          // strip gene version number
          let r = gene.gencodeId.match(/^(ENSG\d+)\.\d+$/);
          // look up orthologs via Ensembl
          let ensembl_url = this.ensemblAPI + 'homology/id/' + r[1] + '?sequence=none&target_taxon=10116&content-type=application/json';
          let self = this;
          this.motrpac_loading = true;
          this.motrpac_error = null;
          this.rat_homologs = null;
          axios.get(ensembl_url).then(function(r) {
            let n_orthologs = r.data.data.length;
            if (n_orthologs > 0) {
              self.rat_homologs = r.data.data[0]['homologies'];
              let nh = self.rat_homologs.length;
              if (nh == 0) {
                self.motrpac_loading = false;
                self.motrpac_error = "No Ensembl ortholog found.";
              }
            }
          }).catch(function(e) {
            self.motrpac_loading = false;
            self.motrpac_error = "No Ensembl ortholog found";
            self.rat_homologs =[];
          });
      }
    },
    sel_gene_index(ind) {
      if (ind != null) {
        this.clearSelectedGene();
        this.sel_gene = this.gene_ss_results[ind];
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
      if (this.sel_gene) { this.getGeneExpressionData(this.sel_gene); }
    },
    sel_tissue(tissue) {
      if (this.uberon2tissues && this.sel_gene) {
        this.clearExpressionData();
        this.getGeneExpressionData(this.sel_gene);
        this.getMotrpacGeneExpressionData(this.rat_homologs);
      }
    },
    gtex_expression_data(ed) {
      this.displayGTExExpressionData();
    },
    recount_expression_data(ed) {
     this.displayRecountExpressionData();
    },
    motrpac_expression_data(ed) {
     this.displayMotrpacExpressionData();
    },
    subset_by_sex(ss) {
      this.clearExpressionData();
      this.getGeneExpressionData(this.sel_gene);
    },
    show_outliers(so) {
      this.clearExpressionData();
      this.getGeneExpressionData(this.sel_gene);
    },
    log_scale(so) {
      this.clearExpressionData();
      this.getGeneExpressionData(this.sel_gene);
    },
    rat_homologs(rh) {
      if ((rh != null) && (rh.length > 0)) {
        this.getMotrpacGeneExpressionData(rh);
      }
    },
  },
  mounted() {
    this.initConfigs();
    this.getTissueInfo(GTEX_VER);
  },
  computed: {
    motrpacTitle() {
      if (this.rat_homologs == null) {
        return "no gene selected";
      } else {
        let nh = this.rat_homologs.length;
        if (nh == 0) {
          let msg = "No Ensembl rat ortholog found";
          if (this.sel_gene) {
            msg = msg + " for " + this.sel_gene.gencodeId;
          }
          return msg;
        } else {
          return this.rat_homologs[0]['target']['species'] + " | " + this.rat_homologs[0]['target']['id'] + " | " + this.rat_homologs[0]['target']['perc_id'] + "% identity";
        }
      }
    }
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
      this.sel_gene_index = null;
      this.clearExpressionData();
    },
    clearExpressionData() {
      this.gtex_expression_data = null;
      $("#gtex_1-svg").remove();
      this.recount_expression_data = null;
      $("#recount3_1-svg").remove();
      this.motrpac_expression_data = null;
      $("#motrpac_1-svg").remove();
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
    getGeneExpressionData(gene) {
      let subset = (this.subset_by_sex) ? 'sex' : null;
      let tissues = [];
      let self = this;

      // look up UBERON id
      if (this.sel_tissue && this.uberon2tissues) {
        tissues = tissues.concat(this.uberon2tissues[this.sel_tissue.uberon_id]);
      }
      if (tissues.length == 0) return;

      // GTEx v8
      let tissues_str = "&tissueSiteDetailId=" + encodeURIComponent(tissues.map(t => t['tissueSiteDetailId']).join(","));
      let gtex_url = GTEX_API + "expression/geneExpression?gencodeId=" + gene.gencodeId + tissues_str;
      if (subset) gtex_url += "&attributeSubset=" + subset;
      gtex_url += this.gtexURLSuffix();
      this.exp_gene = gene;
      self.gtex_loading = true;
      self.gtex_error = null;
      axios.get(gtex_url).then(function(r) {
        self.gtex_loading = false;
        self.gtex_expression_data = r.data.geneExpression;
      });

      // Snaptron/Recount3
      // map tissueSiteDetail to rail ids
      let mm = recount_map[tissues[0].tissueSiteDetail];
      let wb_male_rids = recount_map[tissues[0].tissueSiteDetail]['male'];
      let wb_female_rids = recount_map[tissues[0].tissueSiteDetail]['female'];
      let all_rids = wb_male_rids;
      all_rids = all_rids.concat(wb_female_rids);

      // lookup by gencodeId
      let recount_url = 'http://127.0.0.1/snaptron/gtex/genes?regions=' + gene.gencodeId + '&sids=' + all_rids.join(",");
      // lookup by gene symbol
//      let recount_url = 'http://127.0.0.1/snaptron/gtex/genes?regions=' + gene.geneSymbolUpper + '&sids=' + all_rids.join(",");

      self.recount_loading = true;
      self.recount_error = null;
      axios.get(recount_url).then(function(r) {
        self.recount_loading = false;
        self.recount_tissue = tissues[0]['tissueSiteDetail'];;
        self.recount_tissue_color_hex = tissues[0]['colorHex'];
        self.recount_expression_data = r.data;
      }).catch(function(e) {
        self.recount_loading = false;
        let err = "No expression data found";

        if (self.sel_gene) {
          err = err + " for " + self.sel_gene.gencodeId;
        }
        self.recount_error = err;
      });
    },

    getMotrpacGeneExpressionData(homologs) {
      let self = this;
      let ensembl_id = homologs[0]['target']['id'];
      let tissue = this.sel_tissue.motrpac;
      let motrpac_url = this.motrpacAPI + '/gene/' + ensembl_id + '/' + tissue + '/tpm';
      self.motrpac_loading = true;
      self.motrpac_error = null;
      axios.get(motrpac_url).then(function(r) {
        self.motrpac_loading = false;
        if (r.data.success) {
          self.motrpac_expression_data = r.data;
        } else {
          self.motrpac_error = r.data.error;
        }
      }).catch(function(e) {
        self.motrpac_loading = false;
        let err = "MoTrPAC data not available";
        self.motrpac_error = err;
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
        } else if ((gene_ids[0] == this.exp_gene.gencodeId) || (gene_ids[1] == this.exp_gene.geneSymbolUpper)) {
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
//          console.log("read additional gene " + gene_ids[0]);
        }
      });
      GTExViz.groupedViolinPlot(violin_config);
    },

    displayMotrpacExpressionData() {
      if (this.motrpac_expression_data == null || this.tissue_info == null) return;
      let units = 'TPM';
      let violin_config = this.violin_configs['motrpac'];
      violin_config.data = [];
      violin_config.showOutliers = this.show_outliers;
      violin_config.yLabel = this.log_scale ? 'log10(' + units + '+1)' : units;
      violin_config.scale = this.log_scale ? 'log' : 'linear';

      let tissue = {
        'group': 'MoTrPAC',
        'label': this.sel_tissue.motrpac,
        'values': this.motrpac_expression_data.data,
        'color': '#' + this.sel_tissue.color_hex,
        'fill-opacity': '0.5'
      };
      violin_config.data.push(tissue);
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

div.dframe_footer {
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
