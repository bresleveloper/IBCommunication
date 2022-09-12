import { Version } from '@microsoft/sp-core-library';
import {
  IPropertyPaneConfiguration,
  PropertyPaneTextField
} from '@microsoft/sp-property-pane';
import { BaseClientSideWebPart } from '@microsoft/sp-webpart-base';
import { escape } from '@microsoft/sp-lodash-subset';

import styles from './BackButtonWebPart.module.scss';
import * as strings from 'BackButtonWebPartStrings';

export interface IBackButtonWebPartProps {
  text: string;
}

export default class BackButtonWebPart extends BaseClientSideWebPart<IBackButtonWebPartProps> {

  public render(): void {
    this.properties.text = this.properties.text ? this.properties.text : "אחורה"
    this.domElement.innerHTML = `
          <a data-version="1.0.0.0" class="${ styles['back-button'] }">
            <span class="${ styles.label }">${ this.properties.text }</span>
          </a>`;

    this.domElement.querySelector("a").onclick = function back_button_onclick(){
      console.log("back_button_onclick");
      history.back();
    }
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
                PropertyPaneTextField('text', { 
                  label: "text for the button"
                })
              ]
            }
          ]
        }
      ]
    };
  }
}
