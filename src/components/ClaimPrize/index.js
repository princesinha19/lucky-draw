import React, { useState } from "react";
import AlertModal from "../Utils/AlertModal";
import SuccessModal from "../Utils/SuccessModal";
import { Row, Col, Button, Card } from "react-bootstrap";

export default function ClaimPrize({
    poolAddress,
    contractInstance,
    ticketNumber,
    callback,
}) {
    const [approving, setApproving] = useState(false);
    const [processing, setProcessing] = useState(false);
    const [errorModal, setErrorModal] = useState({
        msg: "",
        open: false
    });
    const [successModal, setSuccessModal] = useState({
        msg: "",
        open: false
    });

    const handleClaimPrize = async () => {
        try {
            const address = await contractInstance.methods
                .getApproved(
                    ticketNumber
                ).call();

            if (address === poolAddress) {
                claimPrize();
            } else {
                const success = await approveToken();
                if (success) {
                    claimPrize();
                }
            }
        } catch (error) {
            setErrorModal({
                open: true,
                msg: error.message,
            });
        }
    }

    const claimPrize = () => {
        return new Promise(async (resolve, reject) => {
            contractInstance.methods.claimPrize
                (
                    ticketNumber,
                )
                .send()
                .on("transactionHash", () => {
                    setProcessing(true);
                })
                .on("receipt", () => {
                    setProcessing(false);
                    setSuccessModal({
                        open: true,
                        msg: "Congratulations 🎉 !! " +
                            "You successfully claimed your prize !!",
                    });
                })
                .catch((error) => {
                    setProcessing(false);
                    reject(error);
                });
        });
    };

    const approveToken = () => {
        return new Promise(async (resolve, reject) => {
            contractInstance.methods.approve
                (
                    poolAddress,
                    ticketNumber,
                )
                .send()
                .on("transactionHash", () => {
                    setApproving(true);
                })
                .on("receipt", () => {
                    setApproving(false);
                    resolve(true);
                })
                .catch((error) => {
                    setApproving(false);
                    reject(error);
                });
        });
    }

    return (
        <div>
            <Card
                className="mx-auto form-card text-center"
                style={{ backgroundColor: "rgb(253, 255, 255)" }}
            >
                <Card.Header>
                    <u>Claim Prize</u>
                </Card.Header>

                <Card.Body>
                    <div>
                        <div className="info-message">
                            Congratulations
                            <span role="img" aria-label="congratualation-emoji"> 🎉</span><br />
                            You have winner ticket. Please click below button to claim your prize.<br />
                        </div>

                        <Row className="text-center" style={{ paddingTop: "20px", paddingBottom: "20px" }}>
                            <Col>
                                <Button variant="success" onClick={handleClaimPrize}>
                                    {approving ?
                                        <div className="d-flex align-items-center">
                                            Approving
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
                            </Col>
                        </Row>
                    </div>
                </Card.Body>

            </Card>

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
                onConfirm={callback}
            >
                {successModal.msg}
            </SuccessModal>
        </div >
    );
}
