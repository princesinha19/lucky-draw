import React, { useEffect, useState } from "react";
import ipfsClient from "ipfs-http-client";
import AlertModal from "../Utils/AlertModal";
import SuccessModal from "../Utils/SuccessModal";
import metamask from "../../assets/metamask.png";
import ipfsLogo from "../../assets/ipfs-logo.png";
import history from "../Utils/history";
import {
    Row,
    Col,
    Form,
    Card,
    Image,
    Button,
    CardDeck,
    Dropdown,
    DropdownButton,
} from "react-bootstrap";

export default function CreatePool() {
    const [deploying, setDeploying] = useState(false);
    const [processing, setProcessing] = useState(false);
    const [addPoolState, setAddPoolState] = useState({
        poolTokenName: "",
        poolTokenSymbol: "",
        ticketPrice: "",
        drawInterval: "",
        tokenBuyDuration: "",
        ticketBuyToken: "0x5A01Ea01Ba9A8DC2B066714A65E61a78838B1b9e",
        image: null,
    });

    const [showMetamaskError, setShowMetamaskError] = useState(
        false
    );
    const [errorModal, setErrorModal] = useState({
        msg: "",
        open: false
    });
    const [successModal, setSuccessModal] = useState({
        msg: "",
        open: false
    });
    const [tokens] = useState([
        { name: "DAI", address: "0x5A01Ea01Ba9A8DC2B066714A65E61a78838B1b9e" },
        { name: "USDC", address: "0x65471bdCDb3720Dc07B914756884b50a2b4395fb" }
    ]);

    const ipfs = ipfsClient({
        host: 'ipfs.infura.io',
        port: 5001,
        protocol: 'https',
    });

    const handleCreatePool = async () => {
        let tokenBaseUrl = "";
        if (addPoolState.image) {
            setDeploying(true);
            const ipfsHash = await deployImage();
            tokenBaseUrl = `https://ipfs.io/ipfs/${ipfsHash}`;
            setDeploying(false);
        }

        window.poolFactory.methods
            .addDrawPool(
                addPoolState.poolTokenName,
                addPoolState.poolTokenSymbol,
                addPoolState.ticketBuyToken,
                addPoolState.ticketPrice,
                addPoolState.drawInterval,
                addPoolState.tokenBuyDuration,
                tokenBaseUrl,
            )
            .send()
            .on('transactionHash', () => {
                setProcessing(true);
            })
            .on('receipt', (_) => {
                setProcessing(false);
                setSuccessModal({
                    open: true,
                    msg: "Congratulations 🎉 !! " +
                        "Pool successfully created !!",
                });
            })
            .catch((error) => {
                setProcessing(false);
                setErrorModal({
                    open: true,
                    msg: error.message,
                });
                console.log(error.message)
            });
    };

    const deployImage = () => {
        return new Promise((resolve) => {
            const reader = new window.FileReader()
            reader.readAsArrayBuffer(addPoolState.image);

            reader.onloadend = async () => {
                const files = [{
                    path: addPoolState.image.name,
                    content: reader.result
                }];

                for await (const result of ipfs.addAll(files)) {
                    resolve(result.cid.string);
                }
            }
        });
    }

    useEffect(() => {
        if (typeof window.ethereum === 'undefined' ||
            !window.ethereum.selectedAddress
        ) {
            setShowMetamaskError(true);
        }
    }, []);

    return (
        <div style={{ marginTop: "5%" }}>
            {showMetamaskError ?
                <AlertModal
                    open={showMetamaskError}
                    toggle={() => {
                        setShowMetamaskError(false);
                        history.push('/');
                    }}
                >
                    <div>
                        {typeof window.ethereum === 'undefined' ?
                            <div>
                                You can't use these features without Metamask.
                                <br />
                                Please install
                                <Image width="50px" src={metamask}></Image>
                                first !!
                            </div>
                            :
                            <div>
                                Please connect to
                                <Image width="50px" src={metamask}></Image>
                                to use this feature !!
                            </div>
                        }
                    </div>
                </AlertModal>
                :
                <CardDeck>
                    <Card className="hidden-card"></Card>

                    <Card className="mx-auto create-card">
                        <Card.Header>
                            <u>Create Draw Pool</u>
                        </Card.Header>

                        <Card.Body>
                            <Row style={{ marginTop: "10px" }}>
                                <Col className="text-header">
                                    Pool Token Name:
                                </Col>
                                <Col style={{ paddingLeft: "0px" }}>
                                    <Form.Control
                                        className="mb-4"
                                        type="text"
                                        placeholder="NFT Token Name"
                                        onChange={(e) => setAddPoolState({
                                            ...addPoolState,
                                            poolTokenName: e.target.value
                                        })}
                                        style={{ width: "80%" }}
                                        value={addPoolState.poolTokenName}
                                        required
                                    />
                                </Col>
                            </Row>

                            <Row>
                                <Col className="text-header">
                                    Pool Token Symbol:
                                </Col>
                                <Col style={{ paddingLeft: "0px" }}>
                                    <Form.Control
                                        className="mb-4"
                                        type="text"
                                        placeholder="NFT Token Symbol"
                                        onChange={(e) => setAddPoolState({
                                            ...addPoolState,
                                            poolTokenSymbol: e.target.value
                                        })}
                                        style={{ width: "80%" }}
                                        value={addPoolState.poolTokenSymbol}
                                        required
                                    />
                                </Col>
                            </Row>

                            <Row>
                                <Col className="text-header">
                                    Ticket Price:
                                </Col>
                                <Col style={{ paddingLeft: "0px" }}>
                                    <Form.Control
                                        className="mb-4"
                                        type="number"
                                        step="0"
                                        placeholder="Price of the ticket"
                                        onChange={(e) => setAddPoolState({
                                            ...addPoolState,
                                            ticketPrice: e.target.value
                                        })}
                                        style={{ width: "80%" }}
                                        value={addPoolState.ticketPrice}
                                        required
                                    />
                                </Col>
                            </Row>

                            <Row>
                                <Col className="text-header">
                                    Every Draw Interval:
                                </Col>
                                <Col style={{ paddingLeft: "0px" }}>
                                    <Form.Control
                                        className="mb-4"
                                        type="number"
                                        step="0"
                                        placeholder="In minutes (Eg. 15)"
                                        onChange={(e) => setAddPoolState({
                                            ...addPoolState,
                                            drawInterval: e.target.value
                                        })}
                                        style={{ width: "80%" }}
                                        value={addPoolState.drawInterval}
                                        required
                                    />
                                </Col>
                            </Row>

                            <Row>
                                <Col className="text-header">
                                    Buy Duration:
                                </Col>
                                <Col style={{ paddingLeft: "0px" }}>
                                    <Form.Control
                                        className="mb-4"
                                        type="number"
                                        step="0"
                                        placeholder="In minutes (Eg. 30)"
                                        onChange={(e) => setAddPoolState({
                                            ...addPoolState,
                                            tokenBuyDuration: e.target.value
                                        })}
                                        style={{ width: "80%" }}
                                        value={addPoolState.tokenBuyDuration}
                                        required
                                    />
                                </Col>
                            </Row>

                            <Row style={{ marginBottom: "30px" }}>
                                <Col className="text-header">
                                    Token For Buy:
                                </Col>
                                <Col style={{ paddingLeft: "0px" }}>
                                    <DropdownButton
                                        style={{
                                            position: "absolute",
                                        }}
                                        title={tokens.map((element) => (
                                            addPoolState.ticketBuyToken === element.address ?
                                                element.name
                                                : null
                                        ))}
                                        variant="outline-info"
                                        onSelect={(event) => setAddPoolState({
                                            ...addPoolState,
                                            ticketBuyToken: event
                                        })}
                                    >
                                        {tokens.map((element, key) => (
                                            <Dropdown.Item
                                                key={key}
                                                eventKey={element.address}
                                            >
                                                {element.name}
                                            </Dropdown.Item>
                                        ))}
                                    </DropdownButton>
                                </Col>
                            </Row>

                            <Row>
                                <Col className="text-header">
                                    NFT Token Image:
                                </Col>
                                <Col style={{ paddingLeft: "0px" }}>
                                    <Form.Control
                                        className="mb-4"
                                        type="file"
                                        onChange={(event) => setAddPoolState({
                                            ...addPoolState,
                                            image: event.target.files[0]
                                        })}
                                        style={{ width: "80%" }}
                                        required
                                    />
                                </Col>
                            </Row>

                            {addPoolState.image ?
                                <Row>
                                    <Col>
                                        <Image
                                            src={URL.createObjectURL(
                                                addPoolState.image
                                            )}
                                            width="150"
                                            height="150">
                                        </Image>
                                    </Col>
                                </Row>
                                : null
                            }
                        </Card.Body>

                        <Card.Footer className="text-center">
                            <Button
                                onClick={handleCreatePool}
                                variant="outline-success"
                            >
                                {deploying ?
                                    <div className="d-flex align-items-center">
                                        <span>Deploying to </span>
                                        <Image
                                            style={{ marginLeft: "5px" }}
                                            src={ipfsLogo}
                                            width="25px"
                                        ></Image>
                                        <span className="loading ml-2"></span>
                                    </div>
                                    :
                                    (processing ?
                                        <div className="d-flex align-items-center">
                                            Processing
                                        <span className="loading ml-2"></span>
                                        </div>
                                        :
                                        <div>Submit</div>
                                    )
                                }
                            </Button>
                        </Card.Footer>
                    </Card>

                    <Card className="hidden-card"></Card>
                </CardDeck>
            }

            <AlertModal
                open={errorModal.open}
                toggle={() => setErrorModal({
                    ...errorModal, open: false
                })}
            >
                {errorModal.msg}
            </AlertModal>

            <SuccessModal
                open={successModal.open}
                toggle={() => setSuccessModal({
                    ...successModal, open: false
                })}
                onConfirm={() => history.push("/")}
            >
                {successModal.msg}
            </SuccessModal>
        </div>
    );
}
