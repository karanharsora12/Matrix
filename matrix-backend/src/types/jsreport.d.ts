declare module "@jsreport/jsreport-core" {
  const JsReport: (options?: any, defaults?: any) => any;
  export default JsReport;
}

declare module "@jsreport/jsreport-handlebars" {
  const jsreportHandlebars: (options?: any) => any;
  export default jsreportHandlebars;
}

declare module "@jsreport/jsreport-chrome-pdf" {
  const jsreportChromePdf: (options?: any) => any;
  export default jsreportChromePdf;
}
