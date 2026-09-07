import React from "react";
import { Document, Page, StyleSheet, Text, View } from "@react-pdf/renderer";

const styles = StyleSheet.create({
  page: {
    paddingTop: 56,
    paddingBottom: 72,
    paddingHorizontal: 56,
    fontFamily: "Times-Roman",
    color: "#152033",
    backgroundColor: "#fffdf8",
  },
  brandBar: {
    height: 6,
    marginBottom: 22,
    marginHorizontal: -56,
    marginTop: -56,
  },
  kicker: {
    fontSize: 9,
    letterSpacing: 2.4,
    textTransform: "uppercase",
    color: "#8a7040",
    marginBottom: 8,
  },
  title: {
    fontSize: 26,
    fontFamily: "Times-Bold",
    marginBottom: 6,
  },
  meta: {
    fontSize: 11,
    color: "#4b5563",
    marginBottom: 8,
  },
  tagline: {
    fontSize: 11,
    fontFamily: "Times-Italic",
    color: "#5c6574",
    marginBottom: 22,
  },
  sectionTitle: {
    fontSize: 14,
    fontFamily: "Times-Bold",
    marginTop: 18,
    marginBottom: 8,
  },
  body: {
    fontSize: 11,
    lineHeight: 1.5,
  },
  pricingBox: {
    marginTop: 10,
    padding: 12,
    borderWidth: 1,
    borderColor: "#e0d4bf",
    backgroundColor: "#f6f1e8",
  },
  signatureBox: {
    marginTop: 28,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: "#e0d4bf",
  },
  sigLine: {
    marginTop: 24,
    fontSize: 11,
  },
  footer: {
    position: "absolute",
    bottom: 32,
    left: 56,
    right: 56,
    fontSize: 9,
    color: "#6b7280",
    flexDirection: "row",
    justifyContent: "space-between",
  },
});

export function ProposalPdfDocument(props: {
  title: string;
  organizationName: string;
  tagline?: string | null;
  brandColor?: string | null;
  clientName: string;
  currency: string;
  amountLabel?: string | null;
  sections: { title: string; body: string; type?: string }[];
  signature?: {
    signerName: string;
    signerEmail: string;
    signedAt: string;
    typedName?: string;
  } | null;
}) {
  const brand = props.brandColor || "#152033";

  return (
    <Document title={props.title} author={props.organizationName}>
      <Page size="LETTER" style={styles.page}>
        <View style={[styles.brandBar, { backgroundColor: brand }]} />
        <Text style={styles.kicker}>Proposal</Text>
        <Text style={styles.title}>{props.title}</Text>
        <Text style={styles.meta}>
          Prepared by {props.organizationName} for {props.clientName}
        </Text>
        {props.tagline ? <Text style={styles.tagline}>{props.tagline}</Text> : null}

        {props.sections.map((section) => (
          <View key={section.title} wrap={false}>
            <Text style={styles.sectionTitle}>{section.title}</Text>
            {section.type === "pricing" ? (
              <View style={styles.pricingBox}>
                <Text style={styles.body}>{section.body}</Text>
                {props.amountLabel ? (
                  <Text style={[styles.body, { marginTop: 8, fontFamily: "Times-Bold" }]}>
                    Amount due: {props.amountLabel}
                  </Text>
                ) : null}
              </View>
            ) : (
              <Text style={styles.body}>{section.body}</Text>
            )}
          </View>
        ))}

        <View style={styles.signatureBox} wrap={false}>
          <Text style={styles.sectionTitle}>Signature</Text>
          {props.signature ? (
            <>
              <Text style={styles.body}>
                Signed by {props.signature.signerName} ({props.signature.signerEmail})
              </Text>
              <Text style={styles.body}>{props.signature.signedAt}</Text>
              {props.signature.typedName ? (
                <Text style={[styles.sigLine, { fontFamily: "Times-Italic", fontSize: 16 }]}>
                  {props.signature.typedName}
                </Text>
              ) : null}
            </>
          ) : (
            <>
              <Text style={styles.body}>Awaiting signature on the client portal.</Text>
              <Text style={styles.sigLine}>Name ____________________________  Date ________</Text>
            </>
          )}
        </View>

        <View style={styles.footer} fixed>
          <Text>{props.organizationName}</Text>
          <Text render={({ pageNumber, totalPages }) => `${pageNumber} / ${totalPages}`} />
        </View>
      </Page>
    </Document>
  );
}
