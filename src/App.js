import React from 'react';
import './App.css';
import 'bootstrap/dist/css/bootstrap.css';
import {
    Switch,
    HashRouter,
    Route,
    Redirect,
} from "react-router-dom";
import history from './components/Utils/history';
import Header from './components/Header';
import CreatePool from './components/CreatePool';
import HomePage from './components/HomePage';
import ViewPool from './components/ViewPool';
import TokenFaucet from './components/TokenFaucet';

export default function App() {
    const routes = (
        <Switch>
            <Route path="/" exact>
                <HomePage />
            </Route>
            <Route path="/create-pool" exact>
                <CreatePool />
            </Route>
            <Route path="/view/:poolAddress/:nftToken/:buyToken" exact>
                <ViewPool />
            </Route>
            <Route path="/token-faucet" exact>
                <TokenFaucet />
            </Route>
            <Redirect to="/" />
        </Switch>
    );

    return (
        <div className="App">
            <HashRouter history={history}>
                <Header />
                {routes}
            </HashRouter>
        </div>
    );
}
