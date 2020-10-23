import React from "react";
import yesLogo from "../../assets/yes.png";
import noLogo from "../../assets/no.png";
import { Row, Col, Card, Image } from "react-bootstrap";

export default function DisplayTickets({
    nftBalance,
    tickets,
}) {
    return (
        <Card
            className="mx-auto form-card text-center"
            style={{ backgroundColor: "rgb(253, 255, 255)" }}
        >
            <Card.Header>
                <u>Your Tickets</u>
            </Card.Header>

            <Card.Body>
                <div style={{ marginBottom: "20px", color: "green", fontSize: "large" }}>
                    You have {nftBalance} Tickets
                </div>

                {tickets.map((ticket, key) => (
                    <Row key={key} className="text-center" style={{ paddingBottom: "20px" }}>
                        <Col>
                            <u>Ticket Number</u>
                            <span> : </span>
                            <span>{ticket.ticketNumber}</span>
                        </Col>
                        <Col>
                            <u>Still Valid</u>
                            <span> : </span>
                            <Image style={{ marginLeft: "10%" }} src={
                                ticket.isValid ?
                                    yesLogo :
                                    noLogo
                            } width="25px"></Image>
                        </Col>
                    </Row>
                ))}
            </Card.Body>
        </Card>
    );
}
