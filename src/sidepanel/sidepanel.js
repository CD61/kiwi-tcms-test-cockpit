/**
Author: vincent Bourgmayer @ 2026
**/
import { LoginForm } from "./components/loginForm.js";
import { TestPlansList } from "./components/testPlansList.js";
import { TestRunsList } from "./components/testRunsList.js";
import { TestExecutionList } from "./components/testExecutionList.js";
import { TestCase } from "./components/TestCase.js";
import { rpc } from "./components/rpc.js";

const app = document.querySelector("#app");
let _testPlanId;
let _testRunId;
let _testCaseId;
let _testExecutionId;
let _credentials;

async function fetchTestCase(testCaseId) {
	const result = rpc("TestCase.filter", [{"id": testCaseId}]);
	return result;
}

async function fetchTestExecution(testRunId) {
	const result =  rpc("TestExecution.filter", [{ /*"status": 1,2,3*/ "run": testRunId }]);

	return result;
}

async function fetchTestRuns(testPlanId) {
	return rpc("TestRun.filter", [{"plan": testPlanId, "stop_date__isnull": true}]);
}

async function fetchTestPlans() {
	return rpc("TestPlan.filter", []);
}

async function login(credentials) {
	_credentials = credentials;
	const result = rpc("Auth.login", [credentials.username, _credentials.password]);
	console.log(result);
}

async function logout() {
	return rpc("Auth.logout", []);
}

async function updateTestExecution(id, values, comment) {
	values["tested_by"] = _credentials.username;
	
	const result = rpc("TestExecution.update", [id, values])
	console.log(result);
	
	if (comment !== "") {
		const result_comment = rpc("TestExecution.add_comment", [_testExecutionId, comment]);
		console.log(result_comment);
	}
	
	//#todo check if request succeed
	showTestRuns(_testPlanId);
	
	return result;
	
	
}

/* Loading components */

function showTestCase(testCase, testExecutionId) {
	app.innerHTML = "";
	
	console.log("showTestCase");
	console.log(testCase);
	
	const testData = testCase[1]._cells;
	
	_testExecutionId = testData[0].data;
	
	app.appendChild(
		TestCase({ 
			testCaseId: testData[1].data, 
			testExecutionId: _testExecutionId,
			fetchTestCase: fetchTestCase,
			onSubmit: updateTestExecution
		})
	);
}

function showTestExecutions(TestRunId) {
    app.innerHTML = "";

	_testRunId = TestRunId

    app.appendChild(
        TestExecutionList({
			TestRunId: TestRunId,
			fetchTestExecution: fetchTestExecution,
            onSelect: showTestCase
        })
    );
}

function showTestRuns(testPlanId) {
    app.innerHTML = "";
	
	_testPlanId = testPlanId

    app.appendChild(
        TestRunsList({
			testPlanId, 
			fetchTestRuns: fetchTestRuns,
            onSelect: showTestExecutions
        })
    );
}

function showTestPlans() {
    app.innerHTML = "";

    app.appendChild(
        TestPlansList({
			fetchTestPlans: fetchTestPlans,
            onSelect: showTestRuns
        })
    );
}

const loginForm = LoginForm({ onSubmit: login, onSucceed: showTestPlans });

app.appendChild(loginForm);