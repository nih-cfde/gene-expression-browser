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
          class="pr-1">mdi-plus</v-icon>Add Anatomical Sites</v-btn>
    </template>
    <v-card
      class="white"
      height="90vh">
      <v-card-title class="text-h5 primary">
        <span class="text-white">Add/Remove Anatomical Sites</span>
        <v-spacer />
        <v-btn
          icon
          class="white"
          @click="closeDialog()" >
          <v-icon>mdi-close</v-icon>
        </v-btn>
      </v-card-title>

      <v-card-text class="ma-0 pa-2">

        <v-text-field
          v-model="tissueSearch"
          append-icon="mdi-magnify"
          label="Search anatomical sites"
          single-line
          hide-details
          class="ma-0 pa-0 ml-3 mb-1"
        />

        <v-data-table
          v-model="selected"
          :headers="headers"
          :items="tableSites"
          :items-per-page="tableSites.length"
          :search="tissueSearch"
          show-select
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

          <template v-slot:item.uberonId="{ item }">
            <td class="text-xs-left">
              {{ formatUberonId(item.uberonId) }}
            </td>
          </template>

        </v-data-table>

      </v-card-text>
    </v-card>
  </v-dialog>
</template>

<script>
export default {
  name: 'AddAnatomicalSitesDialog',
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
    sites: {
      type: Array,
      required: true
    },
    selectedSitesD: {
      type: Object,
      required: true
    }
  },
  data () {
    return {
      openDialog: false,
      tissueSearch: '',
      selected: [],
      headers: [
        {
          text: 'anatomical site',
          value: 'tissueSiteDetail',
          sortable: false
        },
        {
          text: 'ontology id',
          value: 'uberonId',
          sortable: false
        },
        {
          text: 'RNA-Seq samples',
          value: 'rnaSeqSampleCount',
          sortable: false
        }
      ]
    }
  },
  computed: {
    tableSites () {
      if (this.sites != null) return this.sites
      return []
    }
  },
  watch: {
    //    selected (ns) {
    //    },
    openDialog (od) {
      if (od) {
        let selSites = []
        Object.keys(this.selectedSitesD).forEach(k => { selSites.push(this.selectedSitesD[k]) })
        this.selected = selSites
      }
    }
  },
  methods: {
    closeDialog () {
      this.$emit('dialog_closed', this.selected)
      this.openDialog = false
    },
    formatUberonId (uid) {
      if (uid.match(/^\d+$/)) {
        return 'UBERON:' + uid
      }
      return uid
    }
  }
}
</script>
