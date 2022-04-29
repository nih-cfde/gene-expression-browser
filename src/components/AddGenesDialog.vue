<template>
  <v-dialog
    v-model="openDialog"
    max-width="50%"
    scrollable>
    <template v-slot:activator="{ on, attrs }">
      <v-btn
        v-bind="attrs"
        small
        color="primary"
        v-on="on"><v-icon
          small
          class="pr-1">mdi-plus</v-icon>Add Gene(s)</v-btn>
    </template>
    <v-card
      class="white"
      height="90vh">
      <v-card-title class="text-h5 primary">
        <span class="text-white">Add gene(s)</span>
        <v-spacer />
        <v-btn
          icon
          class="white"
          @click="closeDialog()" >
          <v-icon>mdi-close</v-icon>
        </v-btn>
      </v-card-title>

      <v-card-text class="ma-0 pa-2">

        <v-container class="ma-0 pa-0">
          <v-row class="ma-0 pa-0">
            <v-col
              cols="12"
              class="ma-0 pa-0">

              <v-radio-group
                v-model="add_gene_mode"
                mandatory
                row
                class="pa-0 ma-0"
                hide-details
              >

                <v-radio
                  key="sg-1"
                  label="Search for gene(s)"
                  value="search"
                  class="pa-0 ma-0 pr-3 pl-2"
                  hide-details
                />

                <v-radio
                  key="sg-2"
                  label="Enter a list of gene ids"
                  value="enter_list"
                  class="pa-0 ma-0 pr-3"
                  hide-details
                />
              </v-radio-group>
            </v-col>
          </v-row>

          <v-row
            class="pa-0 ma-0 pt-3">
            <v-col
              cols="12"
              class="pa-0 ma-0">

              <!-- search for genes to add -->
              <v-container
                v-if="add_gene_mode === 'search'"
                class="pa-0 ma-0">
                <v-row class="pa-0 ma-0 pt-2">
                  <v-col
                    cols="10"
                    class="pa-0 ma-0">
                    <v-text-field
                      v-model="gene_ss"
                      label="Enter gene id e.g., MYLK, PTEN, BRCA"
                      clearable
                      clear-icon="mdi-close-circle"
                      solo
                      dense
                      @keyup.enter="searchForGenes(gene_ss)"
                    />
                  </v-col>

                  <v-col
                    cols="2"
                    class="pa-0 ma-0">
                    <v-btn
                      :disabled="gene_ss == null || gene_ss == ''"
                      class="primary ml-2"
                      @click="searchForGenes(gene_ss)">search</v-btn>
                  </v-col>
                </v-row>
              </v-container>

              <!-- cut and paste list of genes -->
              <v-container
                v-else-if="add_gene_mode === 'enter_list'"
                class="pa-0 ma-0">
                <v-row
                  class="ma-0 pa-0 pb-4">
                  <v-col
                    cols="12"
                    class="ma-0 pa-0 pt-2">

                    <v-textarea
                      v-model="gene_list_text"
                      clearable
                      class="pl-2"
                      clear-icon="mdi-delete"
                      label="Enter Gencode gene ids, one per line:"/>

                    <v-btn
                      :disabled="(gene_list_text == null) || (gene_list_text.trim() == '')"
                      class="primary ml-2"
                      @click="listSearchClicked">search</v-btn>
                    <v-btn
                      class="ml-2"
                      @click="showExampleInput">use example ids</v-btn>

                  </v-col>
                </v-row>
              </v-container>

            </v-col>
          </v-row>

          <v-row class="ma-0 pa-0">
            <v-col
              cols="8"
              class="ma-0 pa-0">
              <span class="pl-1">{{ gene_ss_results.length }} gene(s) found:</span>
              <v-spacer/>
            </v-col>
            <v-col
              cols="4"
              class="ma-0 pa-0 text-right">
              <v-btn
                :disabled="numUnaddedGenes === 0"
                small
                class="primary"
                @click="addAllGenes()">
                <v-icon>mdi-plus</v-icon>Add all {{ numUnaddedGenes > 0 ? numUnaddedGenes : '' }}
              </v-btn>
            </v-col>
          </v-row>

          <v-row class="ma-0 pa-0">
            <v-col
              cols="12"
              class="ma-0 pa-0">
              <v-list>
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
                    <v-list-item-title small> {{ item.geneSymbolUpper }} | {{ item.gencodeId }} </v-list-item-title>
                    <v-list-item-subtitle>{{ item.description }} <br>
                      {{ item.genomeBuild }} {{ item.chromosome }} {{ item.start }} - {{ item.end }} ({{ item.strand }})
                    </v-list-item-subtitle>
                  </v-list-item-content>

                  <v-list-item-action>
                    <v-btn
                      :disabled="isGeneSelected(item)"
                      small
                      class="primary"
                      @click="addGene(item)">
                      <v-icon>mdi-plus</v-icon>Add
                    </v-btn>
                  </v-list-item-action>

                </v-list-item>
              </v-list>
            </v-col>
          </v-row>
        </v-container>

      </v-card-text>
    </v-card>
  </v-dialog>
</template>

<script>
import axios from 'axios'

export default {
  name: 'AddGenesDialog',
  props: {
    gtexApi: {
      type: String,
      required: true,
      default: null
    },
    gtexVer: {
      type: String,
      required: true,
      default: null
    },
    pageSize: {
      type: Number,
      required: false,
      default: 50
    },
    selectedGenes: {
      type: Object,
      required: true
    }
  },
  data () {
    return {
      openDialog: false,
      add_gene_mode: 'search',

      // search for genes
      gene_ss: '',
      gene_ss_results: [],

      // enter list of genes
      gene_list_text: null
    }
  },
  computed: {
    numUnaddedGenes () {
      let nu = 0
      this.gene_ss_results.forEach(gr => {
        if (!this.isGeneSelected(gr)) nu++
      })
      return nu
    }
  },
  watch: {
    openDialog (od) {
      if (od) this.clearSearchResults()
    },
    add_gene_mode (od) {
      this.clearSearchResults()
    }
  },
  methods: {
    gtexURLSuffix (datasetId, pageSize, format) {
      var suffix = ''
      if (datasetId) suffix += '&datasetId=' + datasetId
      if (pageSize) suffix += '&pageSize=' + pageSize
      if (format) suffix += '&format=' + format
      return suffix
    },
    searchForGenes (geneIdStr) {
      let geneUrl = this.gtexApi + 'reference/gene?geneId=' + geneIdStr + this.gtexURLSuffix(this.gtexVer, this.pageSize, 'json')
      const pr = axios.get(geneUrl)
      let self = this
      pr.then(function (res) {
        if (res['data']['gene']) {
          self.gene_ss_results = res['data']['gene']
        }
      })
    },
    listSearchClicked () {
      // extract gencodeIds from textarea
      let gencodeRe = /ensg\d+(\.\d+)?/i
      let lines = this.gene_list_text.split('\n')
      let geneIds = []
      let geneIdsD = {}
      lines.forEach(l => {
        let m = l.match(gencodeRe)
        if ((m != null) && (m.length > 0)) {
          let gid = m[0]
          if (!(gid in geneIdsD)) {
            geneIdsD[gid] = 1
            geneIds.push(gid)
          }
        }
      })
      if (geneIds.length > 0) {
        let geneIdStr = geneIds.join(',')
        this.searchForGenes(geneIdStr)
      }
    },
    showExampleInput () {
      let sampleIds = [ 'ENSG00000012048.20', 'ENSG00000139618.14', 'ENSG00000116478.11', 'ENSG00000148795.6', 'ENSG00000075624.13' ]
      this.gene_list_text = sampleIds.join('\n') + '\n'
    },
    addGene (g) {
      this.$emit('add_gene', g)
    },
    addAllGenes (g) {
      let self = this
      this.gene_ss_results.forEach(g => {
        self.$emit('add_gene', g)
      })
    },
    isGeneSelected (g) {
      return (g.gencodeId in this.selectedGenes)
    },
    clearSearchResults () {
      // TODO - should also track and cancel any pending requests
      this.gene_ss_results = []
    },
    closeDialog () {
      this.$emit('dialog_closed')
      this.openDialog = false
    }
  }
}
</script>
