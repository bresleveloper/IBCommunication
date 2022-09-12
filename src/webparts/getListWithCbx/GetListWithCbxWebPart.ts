import { Version } from '@microsoft/sp-core-library';
import {
  IPropertyPaneConfiguration,
  PropertyPaneCheckbox,
  PropertyPaneTextField
} from '@microsoft/sp-property-pane';
import { BaseClientSideWebPart } from '@microsoft/sp-webpart-base';
import { escape } from '@microsoft/sp-lodash-subset';

import styles from './GetListWithCbxWebPart.module.scss';
import * as strings from 'GetListWithCbxWebPartStrings';

import {
  SPHttpClient,
  SPHttpClientResponse,
} from '@microsoft/sp-http';

export interface IGetListWithCbxWebPartProps {
  AddTitle: boolean;
  ListTitle: string;
  ColumnInternalName: string;
  CategoryColInternalName: string;

  ListTitleDesc: string;
  ColumnInternalNameDesc: string;

}

export default class GetListWithCbxWebPart extends BaseClientSideWebPart<IGetListWithCbxWebPartProps> {

  itemsDesc=[];
  items=[];
  v = `data-version="1.0.0.10"`

  public render(): void {
      this.domElement.innerHTML = `<span ${ this.v }>loading</span>`

      let p = this.properties

      window["__GetListWithCbxWebPart"] = {}
      let w = window["__GetListWithCbxWebPart"]

      if (p.ColumnInternalName && p.ListTitle && p.CategoryColInternalName 
                               && p.ListTitleDesc && p.ColumnInternalNameDesc) {

        this.getListItems(p.ListTitleDesc).then(itemsDesc =>{
          this.itemsDesc = itemsDesc.value
          w['itemsDesc'] = itemsDesc.value
          console.log("GetListWithCbxWebPart - ListTitleDesc", itemsDesc.value);
          
        });

        this.getListItems(p.ListTitle).then(items =>{
          this.items = items.value
          w['items'] = items.value
          console.log("GetListWithCbxWebPart - ListTitle", items.value);
          this.buildHTML();
        })
      } else {
        this.domElement.innerHTML = `<span ${ this.v } class="${styles.getItemColValue_error}">invalid settings!</span>`
      }
  }

  public buildHTML() {

    let itemTemplate = `<div class="${ styles.item }">
      <input data-category="##CAT##" data-id="##ID##" type="checkbox"/>
      <span class="${ styles.titleSpan }">##TITLE##</span>
      <span>##TEXT##</span>
    </div>`

    let html = `<div class="${ styles.flexCol }">`

    console.log(`GetListWithCbxWebPart - buildHTML - this.items.forEach`,  this.items );

    this.items.forEach(x => {
      let itemHtml = itemTemplate.replace("##TEXT##", x[this.properties.ColumnInternalName])
      itemHtml = itemHtml.replace("##CAT##", x[this.properties.CategoryColInternalName])
      itemHtml = itemHtml.replace("##ID##", x.ID)
      if (this.properties.AddTitle && this.properties.AddTitle == true) {
        itemHtml = itemHtml.replace("##TITLE##", x.Title)
      } else {
        itemHtml = itemHtml.replace("<span>##TITLE##</span>", '')
      }
      html += itemHtml
    });
    html += `</div><div id="SelectedDescDiv" class="${ styles.flexCol }"></div>`

    console.log(`GetListWithCbxWebPart - `,  this.v );
    this.domElement.innerHTML = `
      <div ${ this.v } class="${ styles.getListWithCbx }">
        <div class="${ styles.container }">
          <div class="${ styles.row }">
            <div class="${ styles.column }">
              ${html}
            </div>
          </div>
        </div>
      </div>`;

    setTimeout(() => {
      console.log("GetListWithCbxWebPart - timeout bindEvents");
      this.bindEvents()
    }, 100);

  }

  public bindEvents(){
    let allCbx = [];
    console.log("GetListWithCbxWebPart - all inputs by query", this.domElement.querySelectorAll('input[type=checkbox]'));
    
    this.domElement.querySelectorAll('input[type=checkbox]').forEach(cbxE =>{ 
      let cbx = cbxE as HTMLInputElement
      allCbx.push(cbx)
    });

    console.log("GetListWithCbxWebPart - allCbx", allCbx);


    allCbx.forEach(cbx =>{
      console.log("GetListWithCbxWebPart - allCbx binding");

      cbx.onclick = (ev)=>{
        console.log("GetListWithCbxWebPart - cbx.onselect", ev);

        // 1. get items by category
        let allCbxSelected = allCbx.filter(cbx => cbx.checked == true)
        let catsItems = {}
        allCbxSelected.forEach(cbx => {
          let cat = cbx.getAttribute("data-category")
          let itemID = cbx.getAttribute("data-id")
          let item = this.items.filter(x => x.ID == itemID)[0]//expected to exist since we pu it there
          if (!catsItems[cat]) {
            catsItems[cat] = []
          } else {
            catsItems[cat].push(item)
          }
        })

        // 2. build html per cat
        let selectedCat = Object.keys(catsItems)
        let html = ''
        selectedCat.forEach(cat => {
          let catItems = catsItems[cat]
          let catHtml = `<div class="${ styles.DescDivItem }"><h1>סיכום ושיקוף שיחה</h1>`

          //2.1 get cat tempalte

          let descFiltered = this.itemsDesc.filter(_descItem => _descItem.Title == cat)
          if (!descFiltered || !descFiltered.length || descFiltered.length != 1) {
            console.warn("we have category without a template description, skipping category", cat);
            return;
          }

          //OData__x05e9__x05d9__x05e7__x05d5__x05
          let catTemplate = descFiltered[0][this.properties.ColumnInternalNameDesc] 
          console.log("GetListWithCbxWebPart - catTemplate", catTemplate, catItems);

          //לרום איפוס ##PRICE## וככה תעשה ##UPLOAD## ועוד כל מיני
          //OData__x05de__x05d7__x05d9__x05e8__x05 עמודת מחיר
          let pricesValues = ''
          let uploadsValues = ''
          catItems.forEach(x => {
            pricesValues += x['OData__x05de__x05d7__x05d9__x05e8__x05'] + ", ";
            uploadsValues += x['OData__x05d8__x05d5__x05d5__x05d7__x050'] + ", ";
          });//end for items

          catHtml += catTemplate.replace('##PRICE##', pricesValues)
                                .replace('##UPLOAD##', uploadsValues)

          html += catHtml
        });//end for cat

        //3. set new html
        console.log("GetListWithCbxWebPart - set new html", html, this.domElement.querySelector("#SelectedDescDiv"));

        let SelectedDescDiv = this.domElement.querySelector("#SelectedDescDiv")
        SelectedDescDiv.innerHTML = html
      }//end onselect
    })
  }

  public buildDescriptionHtml(){
    
  }
  
  public getListItems(listName: string, $select:string = null, $filter:string = null): Promise<any> {
    let promise = new Promise((resolve, reject) => {
        this.context.spHttpClient.get(
            this.context.pageContext.web.absoluteUrl +
            `/_api/web/lists/GetByTitle('${listName}')/Items?$top=1000&${ $select ? $select : '' }&${ $filter ? $filter : '' }`, SPHttpClient.configurations.v1)
            .then((response: SPHttpClientResponse) => {
                response.json().then((data) => {
                    console.log('list items for', listName, data);
                    resolve(data);
                });
            });
    });
    
    return promise;
  }


  protected get dataVersion(): Version {
    return Version.parse('1.0');
  }

  protected getPropertyPaneConfiguration(): IPropertyPaneConfiguration {
    return {
      pages: [
        {
          header: {
            description: strings.PropertyPaneDescription
          },
          groups: [
            {
              groupName: "רשימה ראשית לפריטים לבחירה",
              groupFields: [
                PropertyPaneTextField('ListTitle', { label: "ListTitle" }),
                PropertyPaneTextField('ColumnInternalName', { label: "ColumnInternalName" }),
                PropertyPaneTextField('CategoryColInternalName', { label: "CategoryColInternalName" }),
                PropertyPaneCheckbox('AddTitle', { text: "AddTitle" }),
              ]
            },
            {
              groupName: "רשימה שניה עבור מידע לפי קטגוריה",
              groupFields: [
                PropertyPaneTextField('ListTitleDesc', { label: "ListTitleDesc" }),
                PropertyPaneTextField('ColumnInternalNameDesc', { label: "ColumnInternalNameDesc" }),
              ]
            }
          ]
        }
      ]
    };
  }
}
/*AddTitle: boolean;
ListTitle: string;
ColumnInternalName: string;

ListTitleDesc: string;
  ColumnInternalNameDesc: string;



  DEBUG

    allCbx = [];
    document.querySelectorAll('input[type=checkbox]').forEach(cbxE =>{ 
      let cbx = cbxE 
      allCbx.push(cbx)
    });

    allCbxSelected = allCbx.filter(cbx => cbx.checked == true)
    allCbxSelected

*/
