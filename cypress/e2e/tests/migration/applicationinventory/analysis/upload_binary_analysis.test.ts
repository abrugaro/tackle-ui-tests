/*
Copyright © 2021 the Konveyor Contributors (https://konveyor.io/)

Licensed under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License.
You may obtain a copy of the License at

    http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and
limitations under the License.
*/
/// <reference types="cypress" />

import {
    deleteAllBusinessServices,
    deleteApplicationTableRows,
    getRandomAnalysisData,
    getRandomApplicationData,
    login,
    preservecookies,
    resetURL,
    writeGpgKey,
} from "../../../../../utils/utils";
import { Proxy } from "../../../../models/administration/proxy/proxy";
import { Analysis } from "../../../../models/migration/applicationinventory/analysis";
import { analysis, AnalysisStatuses } from "../../../../types/constants";
import { GeneralConfig } from "../../../../models/administration/general/generalConfig";

const analyses = {};

describe(["@tier1"], "Upload Binary Analysis", () => {
    before("Login", function () {
        // Perform login
        login();

        // Enable HTML anc CSV report downloading
        let generalConfig = GeneralConfig.getInstance();
        generalConfig.enableDownloadHtml();
        generalConfig.enableDownloadCsv();

        deleteApplicationTableRows();

        //Disable all proxy settings
        Proxy.disableAllProxies();
    });

    beforeEach("Persist session", function () {
        // Save the session and token cookie for maintaining one login session
        preservecookies();
        cy.fixture("application").then(function (appData) {
            this.appData = appData;
        });
        cy.fixture("analysis").then(function (analysisData) {
            this.analysisData = analysisData;
        });

        // Interceptors
        cy.intercept("POST", "/hub/application*").as("postApplication");
        cy.intercept("GET", "/hub/application*").as("getApplication");
        Analysis.open(true);
    });

    afterEach("Persist session", function () {
        // Reset URL from report page to web UI
        resetURL();
    });

    after("Perform test data clean up", function () {
        deleteApplicationTableRows();
        deleteAllBusinessServices();

        // Disable HTML anc CSV report downloading
        let generalConfig = GeneralConfig.getInstance();
        generalConfig.disableDownloadHtml();
        generalConfig.disableDownloadCsv();

        writeGpgKey("abcde");
    });

    it("Create applications and start analyses", function () {
        const application1 = new Analysis(
            getRandomApplicationData("uploadBinary"),
            getRandomAnalysisData(this.analysisData["uploadbinary_analysis_on_acmeair"])
        );
        application1.create();
        cy.wait("@getApplication");
        cy.wait(1000);
        application1.analyze();
        analyses["uploadbinary_analysis_on_acmeair"] = application1;

        const application2 = new Analysis(
            getRandomApplicationData("customRule_customTarget"),
            getRandomAnalysisData(this.analysisData["uploadbinary_analysis_with_customrule"])
        );
        application2.create();
        cy.wait("@getApplication");
        cy.wait(1000);
        application2.analyze();
        analyses["uploadbinary_analysis_with_customrule"] = application2;

        const application3 = new Analysis(
            getRandomApplicationData("DIVA"),
            getRandomAnalysisData(this.analysisData["analysis_for_DIVA-report"])
        );
        application3.create();
        cy.wait("@getApplication");
        cy.wait(1000);
        application3.analyze();
        analyses["analysis_for_DIVA-report"] = application3;

        const application4 = new Analysis(
            getRandomApplicationData("uploadBinary"),
            getRandomAnalysisData(
                this.analysisData["analysis_and_incident_validation_jeeExample_app"]
            )
        );
        application4.create();
        cy.wait("@getApplication");
        cy.wait(1000);
        application4.analyze();
        analyses["analysis_and_incident_validation_jeeExample_app"] = application4;

        const application5 = new Analysis(
            getRandomApplicationData("uploadBinary"),
            getRandomAnalysisData(this.analysisData["analysis_and_incident_validation_camunda_app"])
        );
        application5.create();
        cy.wait("@getApplication");
        cy.wait(1000);
        application5.analyze();
        analyses["analysis_and_incident_validation_camunda_app"] = application5;

        const application6 = new Analysis(
            getRandomApplicationData("uploadBinary"),
            getRandomAnalysisData(
                this.analysisData["analysis_and_incident_validation_complete-duke"]
            )
        );
        application6.create();
        cy.wait("@getApplication");
        cy.wait(1000);
        application6.analyze();
        analyses["analysis_and_incident_validation_complete-duke"] = application6;

        const application7 = new Analysis(
            getRandomApplicationData("uploadBinary"),
            getRandomAnalysisData(this.analysisData["analysis_and_incident_validation_kafka-app"])
        );
        application7.create();
        cy.wait("@getApplication");
        cy.wait(1000);
        application7.analyze();
        analyses["analysis_and_incident_validation_kafka"] = application7;
    });

    it("Upload Binary Analysis", function () {
        const application = analyses["uploadbinary_analysis_on_acmeair"];
        verifyAndValidate(application, true, false, true);
    });

    it("Custom rules with custom targets", function () {
        // Automated https://issues.redhat.com/browse/TACKLE-561
        const application = analyses["uploadbinary_analysis_with_customrule"];

        verifyAndValidate(application, true, false, false, true);

        application.downloadReport("CSV");
    });

    it("DIVA report generation", function () {
        const application = analyses["analysis_for_DIVA-report"];
        verifyAndValidate(application, true, false);
        application.validateTransactionReport();
    });

    it("Analysis for jee-example-app upload binary ", function () {
        verifyAndValidate(analyses["analysis_and_incident_validation_jeeExample_app"], false);
    });

    it("Analysis for camunda-bpm-spring-boot-starter", function () {
        verifyAndValidate(analyses["analysis_and_incident_validation_camunda_app"]);
    });

    it("Analysis for complete-duke app upload binary ", function () {
        verifyAndValidate(analyses["analysis_and_incident_validation_complete-duke"]);
    });

    it("Analysis for kafka-clients-sb app ", function () {
        verifyAndValidate(analyses["analysis_and_incident_validation_kafka"]);
    });

    const verifyAndValidate = (
        analysis: Analysis,
        validateStoryPoints = true,
        validateIncidents = true,
        downloadHTMLReport = false,
        downloadCSVReport = false
    ) => {
        analysis.verifyAnalysisStatus(AnalysisStatuses.completed);

        if (downloadCSVReport) {
            analysis.downloadReport("CSV");
        }

        if (downloadHTMLReport) {
            analysis.downloadReport("HTML");
        }

        analysis.openReport();

        if (validateStoryPoints) {
            analysis.validateStoryPoints();
        }

        if (validateIncidents) {
            analysis.validateIncidents();
        }
    };
});
