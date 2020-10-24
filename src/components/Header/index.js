import React, { useState } from "react";
import {
    Nav,
    Navbar,
    Image,
} from "react-bootstrap";
import logo from "../../assets/logo.png"
import metamask from "../../assets/metamask.png"
import maticLogo from "../../assets/matic-logo.png"
import AlertModal from "../Utils/AlertModal";
import { initContract } from "../../utils/init";

export default function Header() {
    const [errorModal, setErrorModal] = useState(false);

    const handleConnectMetamask = () => {
        if (isMetamaskInstalled()) {
            initContract();
        } else {
            setErrorModal(true);
        }
    };

    const isMetamaskInstalled = () => {
        return (typeof window.ethereum !== 'undefined');
    }

    return (
        <div>
            <Navbar collapseOnSelect bg="light" variant="light">
                <Navbar.Brand href="#">
                    <Image width="60px" src={logo} />
                </Navbar.Brand>
                <Navbar.Toggle aria-controls="responsive-navbar-nav" />
                <Nav className="mr-auto">
                    <Nav.Link href="#create-pool">Create Pool</Nav.Link>
                    <Nav.Link href="#token-faucet">Token Faucet</Nav.Link>
                </Nav>
                <Nav>
                    <Image
                        style={{ cursor: "pointer" }}
                        width="50px"
                        src={maticLogo}
                        onClick={handleConnectMetamask}
                    />
                </Nav>
            </Navbar>

            <AlertModal
                open={errorModal}
                toggle={() => setErrorModal(false)}
            >
                You can't use these features without Metamask.
                <br />
                Please install
                <Image width="50px" src={metamask}></Image>
                first !!
            </AlertModal>
        </div>
    )
}
