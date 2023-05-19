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
    login,
    hasToBeSkipped,
    preservecookies,
    deleteApplicationTableRows,
    deleteAllBusinessServices,
    getRandomApplicationData,
    getRandomAnalysisData,
    writeMavenSettingsFile,
    resetURL,
} from "../../../../../utils/utils";
import { CredentialsMaven } from "../../../../models/administration/credentials/credentialsMaven";
import { Analysis } from "../../../../models/migration/applicationinventory/analysis";
import {
    AnalysisStatuses,
    CredentialType,
    UserCredentials,
    SEC,
} from "../../../../types/constants";
import * as data from "../../../../../utils/data_utils";
import { CredentialsSourceControlUsername } from "../../../../models/administration/credentials/credentialsSourceControlUsername";
import { CredentialsSourceControlKey } from "../../../../models/administration/credentials/credentialsSourceControlKey";
import { Proxy } from "../../../../models/administration/proxy/proxy";
import { MavenConfiguration } from "../../../../models/administration/repositories/maven";
let source_credential;
let maven_credential;
const mavenConfiguration = new MavenConfiguration();
const analyses = {};

describe(["@tier1"], "Source Analysis", () => {
    before("Login", function () {
        // Perform login
        login();
        deleteApplicationTableRows();

        //Disable all proxy settings
        Proxy.disableAllProxies();

        // Clears artifact repository
        mavenConfiguration.clearRepository();
        // Create source Credentials
        source_credential = new CredentialsSourceControlUsername(
            data.getRandomCredentialsData(
                CredentialType.sourceControl,
                UserCredentials.usernamePassword,
                true
            )
        );
        source_credential.create();

        // Create Maven credentials
        maven_credential = new CredentialsMaven(
            data.getRandomCredentialsData(CredentialType.maven, "None", true)
        );
        maven_credential.create();
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
        writeMavenSettingsFile(data.getRandomWord(5), data.getRandomWord(5));
    });

    it("Create applications and start analyses", function () {
        const application1 = new Analysis(
            getRandomApplicationData("bookserverApp", {
                sourceData: this.appData["bookserver-app"],
            }),
            getRandomAnalysisData(this.analysisData["source_analysis_on_bookserverapp"])
        );
        application1.create();
        cy.wait("@getApplication");
        cy.wait(1000);
        application1.analyze();
        analyses["bookserverApp"] = application1;

        const application2 = new Analysis(
            getRandomApplicationData("tackleTestApp_Source+dependencies", {
                sourceData: this.appData["tackle-testapp-git"],
            }),
            getRandomAnalysisData(this.analysisData["source+dep_analysis_on_tackletestapp"])
        );
        application2.create();
        cy.wait("@getApplication");
        cy.wait(1000);
        application2.manageCredentials(source_credential.name, maven_credential.name);
        application2.analyze();
        analyses["tackleTestApp_Source+dependencies"] = application2;

        const application3 = new Analysis(
            getRandomApplicationData("dayTraderApp_Source+dependencies", {
                sourceData: this.appData["daytrader-app"],
            }),
            getRandomAnalysisData(this.analysisData["source+dep_analysis_on_daytrader-app"])
        );
        application3.create();
        cy.wait("@getApplication");
        cy.wait(1000);
        application3.analyze();
        analyses["dayTraderApp_Source+dependencies"] = application3;

        const application4 = new Analysis(
            getRandomApplicationData("dayTraderApp_MavenCreds", {
                sourceData: this.appData["daytrader-app"],
            }),
            getRandomAnalysisData(this.analysisData["source+dep_analysis_on_daytrader-app"])
        );
        application4.create();
        cy.wait("@getApplication");
        cy.wait(1000);
        application4.manageCredentials("None", maven_credential.name);
        application4.analyze();
        analyses["dayTraderApp_MavenCreds"] = application4;

        const application5 = new Analysis(
            getRandomApplicationData("tackleTestApp_Source", {
                sourceData: this.appData["tackle-testapp-git"],
            }),
            getRandomAnalysisData(this.analysisData["analysis_for_enableTagging"])
        );
        application5.create();
        cy.wait("@getApplication");
        cy.wait(1000);
        application5.manageCredentials(source_credential.name, "None");
        application5.analyze();
        analyses["tackleTestApp_Source"] = application5;

        const scCredsKey = new CredentialsSourceControlKey(
            data.getRandomCredentialsData(
                CredentialType.sourceControl,
                UserCredentials.sourcePrivateKey
            )
        );
        scCredsKey.create();
        const application6 = new Analysis(
            getRandomApplicationData("tackleTestApp_sshCreds", {
                sourceData: this.appData["tackle-testapp-ssh"],
            }),
            getRandomAnalysisData(this.analysisData["analysis_for_enableTagging"])
        );
        application6.create();
        cy.wait("@getApplication");
        cy.wait(1000);
        application6.manageCredentials(scCredsKey.name, "None");
        application6.analyze();
        analyses["tackleTestApp_sshCreds"] = application6;

        const application7 = new Analysis(
            getRandomApplicationData("tackleTestApp_svnRepo", {
                sourceData: this.appData["tackle-testapp-svn"],
            }),
            getRandomAnalysisData(this.analysisData["analysis_for_enableTagging"])
        );
        application7.create();
        cy.wait("@getApplication");
        cy.wait(1000);
        application7.manageCredentials(source_credential.name, "None");
        application7.analyze();
        analyses["tackleTestApp_svnRepo"] = application7;

        const application8 = new Analysis(
            getRandomApplicationData("tackleTestApp_Source+knownLibraries", {
                sourceData: this.appData["tackle-testapp-git"],
            }),
            getRandomAnalysisData(this.analysisData["analysis_for_openSourceLibraries"])
        );
        application8.create();
        cy.wait("@getApplication");
        cy.wait(1000);
        application8.manageCredentials(source_credential.name, maven_credential.name);
        application8.analyze();
        analyses["tackleTestApp_Source+knownLibraries"] = application8;

        const application9 = new Analysis(
            getRandomApplicationData("tackleTestApp_Source_autoTagging", {
                sourceData: this.appData["tackle-testapp-git"],
            }),
            getRandomAnalysisData(this.analysisData["analysis_for_enableTagging"])
        );
        application9.create();
        cy.wait("@getApplication");
        cy.wait(1000);
        application9.manageCredentials(source_credential.name, "None");
        application9.analyze();
        analyses["tackleTestApp_Source_autoTagging"] = application9;

        const application10 = new Analysis(
            getRandomApplicationData("bookserverApp_Disable_autoTagging", {
                sourceData: this.appData["bookserver-app"],
            }),
            getRandomAnalysisData(this.analysisData["analysis_for_disableTagging"])
        );
        application10.create();
        cy.wait("@getApplication");
        application10.analyze();
        analyses["bookserverApp_Disable_autoTagging"] = application10;

        const application11 = new Analysis(
            getRandomApplicationData("Example 1", {
                sourceData: this.appData["konveyor-exampleapp"],
            }),
            getRandomAnalysisData(this.analysisData["analysis_on_example-1-app"])
        );
        application11.create();
        cy.wait("@getApplication");
        cy.wait(1000);
        application11.analyze();
        analyses["Example 1"] = application11;
    });

    it("Source Analysis on bookserver app without credentials", function () {
        // For source code analysis application must have source code URL git or svn
        cy.log(this.analysisData[0]);
        verifyAndValidateStoryPoints(analyses["bookserverApp"]);
    });

    it("Source + dependencies analysis on tackletest app", function () {
        // Source code analysis require both source and maven credentials
        verifyAndValidateStoryPoints(analyses["tackleTestApp_Source+dependencies"]);
    });

    it("Source + dependencies analysis on daytrader app", function () {
        // Automate bug https://issues.redhat.com/browse/TACKLE-721
        verifyAndValidateStoryPoints(analyses["dayTraderApp_Source+dependencies"]);
    });

    it("Analysis on daytrader app with maven credentials", function () {
        // Automate bug https://issues.redhat.com/browse/TACKLE-751
        verifyAndValidateStoryPoints(analyses["dayTraderApp_MavenCreds"]);
    });

    it("Source Analysis on tackle testapp", function () {
        // For tackle test app source credentials are required.
        verifyAndValidateStoryPoints(analyses["tackleTestApp_Source"]);
    });

    it("Analysis on tackle test app with ssh credentials", function () {
        // Automate bug https://issues.redhat.com/browse/TACKLE-707
        verifyAndValidateStoryPoints(analyses["tackleTestApp_sshCreds"]);
    });

    it("Source Analysis on tackle testapp for svn repo type", function () {
        // For tackle test app source credentials are required.
        verifyAndValidateStoryPoints(analyses["tackleTestApp_svnRepo"]);
    });

    it("Automated tagging using Source Analysis on tackle testapp", function () {
        // For tackle test app source credentials are required.
        // Automates https://polarion.engineering.redhat.com/polarion/#/project/MTAPathfinder/workitem?id=MTA-298
        const application = analyses["tackleTestApp_Source_autoTagging"];

        application.verifyAnalysisStatus("Completed");
        application.tagAndCategoryExists(
            this.analysisData["analysis_for_enableTagging"]["techTags"]
        );
    });

    it("Disable Automated tagging using Source Analysis on tackle testapp", function () {
        // Automates Polarion MTA-307
        const application = analyses["bookserverApp_Disable_autoTagging"];

        application.verifyAnalysisStatus("Completed");
        application.applicationDetailsTab("Tags");
        cy.get("h2", { timeout: 5 * SEC }).should("contain", "No tags available");
    });

    it("Analysis for Konveyor example1 application", function () {
        // Automates https://github.com/konveyor/example-applications/tree/main/example-1
        verifyAndValidateStoryPoints(analyses["Example 1"]);
    });

    it("Analysis for known Open Source libraries on tackleTest app", function () {
        // Source code analysis require both source and maven credentials
        verifyAndValidateStoryPoints(analyses["tackleTestApp_Source+knownLibraries"]);
    });

    const verifyAndValidateStoryPoints = (analysis: Analysis) => {
        analysis.verifyAnalysisStatus(AnalysisStatuses.completed);
        analysis.openReport();
        analysis.validateStoryPoints();
    };
});
