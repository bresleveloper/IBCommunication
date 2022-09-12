declare interface IGetListWithCbxWebPartStrings {
  PropertyPaneDescription: string;
  BasicGroupName: string;
  DescriptionFieldLabel: string;
}

declare module 'GetListWithCbxWebPartStrings' {
  const strings: IGetListWithCbxWebPartStrings;
  export = strings;
}
