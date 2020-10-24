import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import history from "../Utils/history";
import Loading from "../Utils/Loading";
import AlertModal from "../Utils/AlertModal";
import SuccessModal from "../Utils/SuccessModal";
import metamask from "../../assets/metamask.png";
import { precision } from "../../utils/precision";
import { time } from "../../utils/time";
import * as erc20Abi from "../../abis/erc20Abi.json"
import * as drawPoolAbi from "../../abis/drawPool.json";
import {
    Card,
    Row,
    Col,
    Image,
    Button,
    CardDeck
} from "react-bootstrap";
import BuyTicket from "../BuyTicket";
import DisplayTickets from "../DisplayTickets";
import ClaimPrize from "../ClaimPrize";

export default function ViewPool() {
    let routes;
    const DAI = "0x5A01Ea01Ba9A8DC2B066714A65E61a78838B1b9e";
    const USDC = "0x65471bdCDb3720Dc07B914756884b50a2b4395fb";
    const { poolAddress, nftToken, buyToken } = useParams();
    const [loading, setLoading] = useState(true);
    const [processing, setProcessing] = useState(false);
    let [erc20Instance, setErc20Instance] = useState();
    let [contractInstance, setContractInstance] = useState();
    const [state, setState] = useState({
        totalTicket: 0,
        ticketPrice: 0,
        drawInterval: 0,
        drawCount: 0,
        poolStartTimestamp: 0,
        ticketBuyEndTime: 0,
        nextDrawStartTime: 0,
        nftBalance: 0,
        tickets: [],
        poolResult: 0,
        tokenBaseURI: "",
        isWinnerTicket: false,
        poolWinnerAddr: "",
        erc20Balance: 0,
    });
    const [successModal, setSuccessModal] = useState({
        msg: "",
        open: false
    });
    const [errorModal, setErrorModal] = useState({
        msg: "",
        open: false
    });
    const [showBuyTicket, setShowBuyTicket] = useState(false);
    const [showMetamaskError, setShowMetamaskError] = useState(false);

    const fetchContractData = async () => {
        try {
            if (!loading) setLoading(true);

            let result;
            if (!contractInstance) {
                result = await createContractInstance();
            }

            contractInstance = contractInstance ? contractInstance : result.contract;
            erc20Instance = erc20Instance ? erc20Instance : result.erc20;

            if (contractInstance) {
                setShowBuyTicket(false);

                const totalTicket = await contractInstance
                    .methods.ticketNumber().call();

                const ticketPrice = await contractInstance
                    .methods.ticketPrice().call();

                const drawInterval = await contractInstance
                    .methods.drawInterval().call();

                const drawCount = await contractInstance
                    .methods.drawCount().call();

                const poolStartTimestamp = await contractInstance
                    .methods.poolStartTime().call();

                const ticketBuyEndTime = await contractInstance
                    .methods.ticketBuyEndTime().call();

                const nextDrawStartTime = await contractInstance
                    .methods.getNextDrawTimestamp().call();

                const nftBalance = await contractInstance
                    .methods.balanceOf(window.userAddress).call();

                const tokenBaseURI = await contractInstance
                    .methods.baseURI().call();

                let poolResult = 0, poolWinnerAddr = "";
                if (Number(drawCount) === Number(totalTicket) - 1 &&
                    time.currentUnixTime() > Number(ticketBuyEndTime)
                ) {
                    poolResult = await contractInstance
                        .methods.getFinalResult().call();

                    poolWinnerAddr = await contractInstance
                        .methods.getPoolWinner().call();
                }

                let tickets = [], isWinnerTicket = false;
                for (let i = 0; i < nftBalance; i++) {
                    const ticketNumber = await contractInstance
                        .methods.tokenOfOwnerByIndex(
                            window.userAddress, i
                        ).call();

                    const isValid = await contractInstance
                        .methods.stillValidTicket(
                            ticketNumber
                        ).call();

                    tickets.push({ ticketNumber, isValid });

                    if (Number(poolResult) === Number(ticketNumber)) {
                        isWinnerTicket = true;
                    }
                }

                let erc20Balance = await precision.remove(
                    await erc20Instance
                        .methods.balanceOf(window.userAddress).call(),
                    await erc20Instance
                        .methods.decimals().call()
                );

                setState({
                    totalTicket,
                    ticketPrice,
                    drawInterval,
                    drawCount,
                    poolStartTimestamp,
                    ticketBuyEndTime,
                    nextDrawStartTime,
                    nftBalance,
                    tickets,
                    poolResult,
                    tokenBaseURI,
                    isWinnerTicket,
                    poolWinnerAddr,
                    erc20Balance,
                });

                setLoading(false);
            }
        } catch (error) {
            setErrorModal({
                open: true,
                msg: error.message,
            });
        }
    };

    const createContractInstance = () => {
        return new Promise((resolve, reject) => {
            try {
                const contract = new window.web3.eth.Contract(
                    drawPoolAbi.default,
                    poolAddress,
                    { from: window.userAddress }
                );

                const erc20 = new window.web3.eth.Contract(
                    erc20Abi.default,
                    buyToken === "DAI" ? DAI : USDC,
                    { from: window.userAddress }
                );

                setErc20Instance(erc20);
                setContractInstance(contract);
                resolve({ contract, erc20 });
            } catch (error) {
                reject(error);
            }
        });
    };

    const handleDraw = () => {
        contractInstance
            .methods.draw(generateRandom())
            .send()
            .on("transactionHash", () => {
                setProcessing(true);
            })
            .on("receipt", () => {
                setProcessing(false);
                fetchContractData();
            })
            .catch((error) => {
                setProcessing(false);
                setErrorModal({
                    open: true,
                    msg: error.message,
                });
            });
    };

    const generateRandom = () => {
        return Math.floor(Math.random() * 10 ** 15);
    };

    const getTokenSymbol = () => {
        return buyToken === "DAI" ?
            "DAI" :
            "USDC";
    };

    useEffect(() => {
        if (typeof window.ethereum === 'undefined' ||
            !window.ethereum.isConnected() ||
            !window.ethereum.selectedAddress
        ) {
            setLoading(false);
            setShowMetamaskError(true);
        }

        if (typeof window.ethereum !== 'undefined' &&
            window.ethereum.selectedAddress &&
            window.ethereum.isConnected()
        ) {
            fetchContractData();
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    if (loading) {
        routes = <Loading />;
    } else {
        routes = (
            <div>
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

                        <Card className="mx-auto view-pool-card">
                            <Card.Body style={{ textAlign: "left", fontWeight: "bold" }}>
                                <p className="view-pool-header">
                                    <u>Lucky Draw Pool</u>
                                </p>

                                <Row style={{ paddingBottom: "20px" }}>
                                    <Col>
                                        <u>Total Tickets</u>
                                        <span> :</span>
                                        <span className="float-right">
                                            {state.totalTicket}
                                        </span>
                                    </Col>

                                    <Col>
                                        <u>Ticket Price</u>
                                        <span> :</span>
                                        <span className="float-right">
                                            <span>{state.ticketPrice} </span>
                                            {getTokenSymbol()}
                                        </span>
                                    </Col>
                                </Row>

                                <Row style={{ paddingBottom: "20px" }}>
                                    <Col>
                                        <u>Draw Complete</u>
                                        <span> :</span>
                                        <span className="float-right">
                                            {state.drawCount}
                                        </span>
                                    </Col>

                                    <Col>
                                        <u>NFT Token</u>
                                        <span> :</span>
                                        <span className="float-right">
                                            {state.tokenBaseURI !== "" ?
                                                <a
                                                    target="_blank"
                                                    href={state.tokenBaseURI}
                                                    rel="noreferrer noopener">
                                                    {nftToken}
                                                </a>
                                                : <div>{nftToken}</div>
                                            }
                                        </span>
                                    </Col>
                                </Row>

                                {Number(state.nextDrawStartTime) > time.currentUnixTime() ?
                                    <Row className="text-center">
                                        <Col>
                                            <u>Next Draw In</u>
                                            <span> : </span>
                                            <span>
                                                {time.getRemaingTime(state.nextDrawStartTime)}
                                            </span>
                                        </Col>
                                    </Row>
                                    :
                                    (Number(state.drawCount) === Number(state.totalTicket) - 1 &&
                                        Number(state.drawCount) > 0 ?
                                        <div>
                                            <div className="auction-alert-message">
                                                Pool Already Closed
                                            </div>
                                            <div className="auction-info-message">
                                                Winner: {state.poolResult}
                                            </div>
                                        </div>
                                        : null
                                    )
                                }

                                {time.currentUnixTime() > Number(state.nextDrawStartTime) &&
                                    Number(state.drawCount) < Number(state.totalTicket) - 1 ?
                                    <Row className="text-center">
                                        <Col>
                                            <Button variant="info" onClick={handleDraw}>
                                                {processing ?
                                                    <div className="d-flex align-items-center">
                                                        Processing
                                                    <span className="loading ml-2"></span>
                                                    </div>
                                                    :
                                                    <div>Execute Draw</div>
                                                }
                                            </Button>

                                            <div className="info-message">
                                                You will get {Number(state.ticketPrice) / 100} {getTokenSymbol()}
                                                <span> for executing this draw.</span>
                                            </div>
                                        </Col>
                                    </Row>
                                    : null
                                }

                                {state.nftBalance > 0 ?
                                    <DisplayTickets
                                        nftBalance={state.nftBalance}
                                        tickets={state.tickets}
                                    />
                                    : null
                                }

                                {showBuyTicket ?
                                    <BuyTicket
                                        poolAddress={poolAddress}
                                        contractInstance={contractInstance}
                                        erc20Instance={erc20Instance}
                                        buyToken={buyToken === "DAI" ? "DAI" : "USDC"}
                                        availableBalance={state.erc20Balance}
                                        balanceNeeded={state.ticketPrice}
                                        callback={fetchContractData}
                                    />
                                    : null
                                }

                                {Number(state.isWinnerTicket) !== 0 ?
                                    <ClaimPrize
                                        poolAddress={poolAddress}
                                        contractInstance={contractInstance}
                                        ticketNumber={state.poolResult}
                                        callback={fetchContractData}
                                    />
                                    :
                                    (Number(state.drawCount) === Number(state.totalTicket) - 1 &&
                                        Number(state.drawCount) > 0 && Number(state.nftBalance) > 0 ?
                                        (state.poolWinnerAddr === window.userAddress ?
                                            <div className="info-message">
                                                Congratulations
                                                <span
                                                    role="img"
                                                    aria-label="congratualation-emoji"
                                                > 🎉</span><br />
                                                You have already claimed your prize
                                                 for ticket number {state.poolResult}<br />
                                                Hope to see you in the other pools
                                                <span role="img" aria-label="smile-emoji"> 🙂</span>
                                            </div>
                                            : null
                                        ) : (Number(state.nftBalance) > 0 && Number(state.drawCount) > 0
                                            && Number(state.drawCount) === Number(state.totalTicket) - 1 ?
                                            <div className="info-message">
                                                You don't have winner ticket. <br /><br />

                                                Thank you for your participation in the pool.<br />
                                                Hope to see you in the other pools
                                                <span role="img" aria-label="smile-emoji"> 🙂</span>
                                            </div>
                                            : null
                                        )
                                    )
                                }
                            </Card.Body>

                            {time.currentUnixTime() < Number(state.ticketBuyEndTime) ?
                                <Card.Footer className="view-pool-footer">
                                    <Button
                                        onClick={() => setShowBuyTicket(true)}
                                        variant="success"
                                    >
                                        {state.nftBalance > 0 ?
                                            <div>Buy More Ticket</div>
                                            :
                                            <div>Want to Buy Ticket ?</div>
                                        }
                                    </Button>
                                </Card.Footer>
                                :
                                (Number(state.nftBalance) === 0 ?
                                    <div className="alert-message">
                                        Participation time already over.<br />
                                        Please check other Pools
                                        <span role="img" aria-label="smile-emoji"> 🙂</span>
                                    </div>
                                    : <div style={{ marginBottom: "20px" }}></div>
                                )
                            }
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
                >
                    {successModal.msg}
                </SuccessModal>
            </div >
        );
    }

    return routes;
}
