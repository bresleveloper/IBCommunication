import { Version } from '@microsoft/sp-core-library';
import {
  IPropertyPaneConfiguration,
  PropertyPaneTextField
} from '@microsoft/sp-property-pane';
import { BaseClientSideWebPart } from '@microsoft/sp-webpart-base';
import { escape } from '@microsoft/sp-lodash-subset';

import styles from './GetItemColValueWebPart.module.scss';
import * as strings from 'GetItemColValueWebPartStrings';


import {
  SPHttpClient,
  SPHttpClientResponse,
} from '@microsoft/sp-http';


export interface IGetItemColValueWebPartProps {
  ListTitle: string;
  ColumnInternalName: string;
  ItemId: string;
}

export default class GetItemColValueWebPart extends BaseClientSideWebPart<IGetItemColValueWebPartProps> {

  public render(): void {
    /*this.domElement.innerHTML = `
      <div class="${ styles.getItemColValue }">
        <div class="${ styles.container }">
          <div class="${ styles.row }">
            <div class="${ styles.column }">
              <span class="${ styles.title }">Welcome to SharePoint!</span>
              <p class="${ styles.subTitle }">Customize SharePoint experiences using Web Parts.</p>
              <p class="${ styles.description }">${escape(this.properties.description)}</p>
              <a href="https://aka.ms/spfx" class="${ styles.button }">
                <span class="${ styles.label }">Learn more</span>
              </a>
            </div>
          </div>
        </div>
      </div>`;*/

    let v = `data-version="1.0.0.0"`

    this.domElement.innerHTML = `<span ${v} >loading</span>`

    let p = this.properties
    if (p.ColumnInternalName && p.ItemId && p.ListTitle) {
      this.getListItemColumnValue().then(value =>{
        this.domElement.innerHTML = `<span ${v} >${value[p.ColumnInternalName]}</span>`
      })
    } else {
      this.domElement.innerHTML = `<span ${v}  class="${styles.getItemColValue_error}">invalid settings!</span>`
    }
  }

  public getListItemColumnValue(){
    let promise = new Promise((resolve, reject) => {

      let url = this.context.pageContext.web.absoluteUrl + 
                `/_api/web/lists/GetByTitle('${this.properties.ListTitle}')` + 
                `/Items(${this.properties.ItemId})` + 
                `?$select=${this.properties.ColumnInternalName}`

      this.context.spHttpClient.get(url, SPHttpClient.configurations.v1).then(
        (response: SPHttpClientResponse) => {
          response.json().then((data) => {
            console.log('getListItemColumnValue :: ', data, url);
            resolve(data)
          })//end json()
      })//end get
    });//end promise

    return promise
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
              groupName: strings.BasicGroupName,
              groupFields: [
                PropertyPaneTextField('ListTitle', { label: "List Title" }),
                PropertyPaneTextField('ColumnInternalName', { label: "Column Internal Name" }),
                PropertyPaneTextField('ItemId', { label: "Item Id" }),
              ]
            }
          ]
        }
      ]
    };
  }
}
