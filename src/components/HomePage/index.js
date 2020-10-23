import React, { useEffect, useState } from "react";
import Loading from "../Utils/Loading";
import { Link } from 'react-router-dom';
import { Card, CardDeck, Image } from "react-bootstrap";
import { time } from "../../utils/time";

export default function HomePage() {
    const dai = "0x5A01Ea01Ba9A8DC2B066714A65E61a78838B1b9e";
    const [loanPools, setlLoanPools] = useState([]);
    const [loading, setLoading] = useState(true);
    const [noMetamsk, setNoMetamask] = useState(false);

    const createSubArray = (pools) => {
        let chunks = [];

        while (pools.length > 4) {
            chunks.push(pools.splice(0, 4));
        }

        if (pools.length > 0) {
            chunks.push(pools);
        }

        setlLoanPools(chunks);
        setLoading(false);
    }

    const getPools = async () => {
        const allPools = [];
        const poolCount = await window.poolFactory
            .methods
            .totalPools()
            .call();

        if (Number(poolCount) === 0) {
            setLoading(false);
        }

        for (let i = poolCount - 1; i >= 0; i--) {
            const drawPool = await window.poolFactory
                .methods
                .allPools(i)
                .call();

            allPools.push(drawPool);

            if (i === 0) {
                createSubArray(allPools);
            }
        }
    }

    const isMetamaskInstalled = () => {
        return (typeof window.ethereum !== 'undefined');
    }

    useEffect(() => {
        if (!isMetamaskInstalled()) {
            setLoading(false);
            setNoMetamask(true);
        } else if (loanPools.length === 0) {
            getPools();
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [])

    function DisplayCard({ pool, count }) {
        return (
            <Card key={count} className="display-pool-card" >
                <Link
                    key={count}
                    style={{ textDecoration: "none", color: "black" }}
                    to={`/view/${pool.poolAddress}/${pool.poolTokenSymbol}/${pool.ticketBuyToken === dai ?
                        "DAI" :
                        "USDC"}`}
                >
                    <Card.Header style={{ marginBottom: "5px" }}>
                        <Image src={pool.baseTokenURI} width="50px"></Image>
                        <span> {pool.poolTokenName} Pool</span>
                    </Card.Header>

                    <Card.Body>
                        <div style={{ marginBottom: "10px" }}>
                            Ticket Price: {pool.ticketPrice}
                            <span> {pool.ticketBuyToken === dai ?
                                "DAI" :
                                "USDC"}
                            </span>
                        </div>
                        <div style={{ marginBottom: "10px" }}>
                            Draw Interval: Every {pool.drawInterval} minutes
                        </div>
                        <div style={{ marginBottom: "5px" }}>
                            {time.currentUnixTime() < (
                                Number(pool.poolStartTimestamp) +
                                Number(pool.ticketBuyDuration) *
                                60
                            ) ?
                                <div>
                                    <span>Buy Close In: </span>
                                    <span className="info-message">
                                        {time.getRemaingTime(
                                            Number(pool.poolStartTimestamp) +
                                            Number(pool.ticketBuyDuration) *
                                            60
                                        )}
                                    </span>
                                </div>
                                :
                                <span className="warning-message">
                                    Buy Period Already Over
                                </span>
                            }
                        </div>
                    </Card.Body>
                </Link>
            </Card>
        );
    }

    if (loading) {
        return <Loading />
    };

    return (
        <div>
            {!noMetamsk ?

                (loanPools.map((element, key) => (
                    element.length === 4 ?
                        <CardDeck key={key} style={{ margin: "2%" }}>
                            {element.map((pool, k) => (
                                <DisplayCard key={k} pool={pool} count={k} />
                            ))}
                        </CardDeck>
                        :
                        <CardDeck key={key} style={{ margin: "2%" }}>
                            {element.map((pool, k) => (
                                <DisplayCard key={k} pool={pool} count={k} />
                            ))}

                            {[...Array(4 - element.length)].map((x, i) =>
                                <Card
                                    key={element.length + i + 1}
                                    className="hidden-card"
                                >
                                </Card>
                            )}
                        </CardDeck>
                )))
                : <div
                    className="alert-message"
                    style={{ marginTop: "20%", fontSize: "x-large" }}
                >
                    You don't have metamask. Please install first !!
                </div>
            }
        </div >
    );
}
