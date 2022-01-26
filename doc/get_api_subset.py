#!/usr/bin/env python3

# Pretty print CFDE/GTEx subset of the GTEx v1 API

# ./get_api_subset.py > cfde_gtex_genex_api_v1.json

import json

PATHS = [
    '/dataset/tissueInfo',
    '/reference/gene',
    '/reference/exon',
    '/reference/transcript',
    '/expression/geneExpression'
]

json_text = ""

# load saved copy of https://gtexportal.org/rest/swagger/
with open("gtex-swagger.json") as fh:
    for line in fh:
        json_text += line
api = json.loads(json_text)

# modify title
api['info']['title'] = 'CFDE/GTEx API'
api['info']['version'] = 'v1'

# remove all other paths not in PATHS
new_paths = {}
for path in PATHS:
    new_paths[path] = api['paths'][path]
api["paths"] = new_paths

print(json.dumps(api, indent=2, sort_keys=True))
