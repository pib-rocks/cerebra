from onshape_client.client import Client
from onshape_client.onshape_url import OnshapeElement
import json
import sys
import re


access = sys.argv[1]
secret = sys.argv[2]
pattern = r"^[ABCD]\d{2}-"

#@markdown Chage the base if using an enterprise (i.e. "https://ptc.onshape.com")
base = 'https://cad.onshape.com' #@param {type:"string"}

#@markdown Would you like to import your API keys from a file, or copy and paste them directly?
keyImportOption = "Upload Keys from File" #@param ["Upload Keys from File", "Copy/Paste Keys"]

from IPython.display import clear_output 
clear_output()
print("Onshape Client successfully imported!")

if keyImportOption == "Upload Keys from File":


  client = Client(configuration={"base_url": base,
                                "access_key": access,
                                "secret_key": secret})
  clear_output()
  print('Onshape client configured - ready to go!')
else:
  access = input("Paste your Onshape Access Key: ")
  secret = input("Paste your Onshape Secret Key: ")
  client = Client(configuration={"base_url": base,
                                "access_key": access,
                                "secret_key": secret})
  clear_output()
  print('Onshape client configured - ready to go!')


#@title Get Parts in Document
#@markdown Function `getPartsInDocument(url: str)` returns JSON of all parts in a document. The URL can be any element from the document.
url = 'https://cad.onshape.com/documents/775cd57fa655e34e0a8b6d93/w/fff5b717a5ab3fbb93f6263c/e/2469ee3a35b80be2cc7edd03' #@param {type:"string"}
showResponse = False#@param {type:"boolean"}
listParts = True#@param {type:"boolean"}



def getPartsInDocument(url: str):
  fixed_url = '/api/parts/d/did/w/wid'

  element = OnshapeElement(url)
  fixed_url = fixed_url.replace('did', element.did)
  fixed_url = fixed_url.replace('wid', element.wvmid)

  method = 'GET'

  params = {}
  payload = {}
  headers = {'Accept': 'application/vnd.onshape.v1+json; charset=UTF-8;qs=0.1',
            'Content-Type': 'application/json'}

  response = client.api_client.request(method, url=base + fixed_url, query_params=params, headers=headers, body=payload)

  parsed = json.loads(response.data)
  return parsed

  print(json.dumps(partResponse, indent=4, sort_keys=True))

partResponse = getPartsInDocument(url)




def exportSTL(url: str, name: str, elementId: str):

  if re.match(pattern, name):
    
    fixed_url = '/api/partstudios/d/did/w/wid/e/eid/stl'
    element = OnshapeElement(url)
    method = 'GET'
    params = {}
    payload = {}
    headers = {'Accept': 'application/vnd.onshape.v1+octet-stream',
            'Content-Type': 'application/json'}

    fixed_url = fixed_url.replace('did', "775cd57fa655e34e0a8b6d93")
    fixed_url = fixed_url.replace('wid', "fff5b717a5ab3fbb93f6263c")
    fixed_url = fixed_url.replace('eid', elementId)
     
    response = client.api_client.request(method, url=base + fixed_url, query_params=params, headers=headers, body=payload)
   
    file = name +'.stl'
    with open(file, 'wb') as f:
      f.write(response.data.encode())
        

for i in range(len(partResponse)):
  exportSTL(url, partResponse[i]["name"],partResponse[i]["elementId"])