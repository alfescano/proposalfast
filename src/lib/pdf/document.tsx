import { Document, Page, StyleSheet, Text, View } from "@react-pdf/renderer";

const styles = StyleSheet.create({
  page: {
    paddingTop: 56,
    paddingBottom: 64,
    paddingHorizontal: 56,
    fontFamily: "Times-Roman",
    color: "#152033",
    backgroundColor: "#fffdf8",
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
    marginBottom: 28,
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
  clientName: string;
  sections: { title: string; body: string }[];
}) {
  return (
    <Document title={props.title} author={props.organizationName}>
      <Page size="LETTER" style={styles.page}>
        <Text style={styles.kicker}>Proposal</Text>
        <Text style={styles.title}>{props.title}</Text>
        <Text style={styles.meta}>
          Prepared by {props.organizationName} for {props.clientName}
        </Text>
        {props.sections.map((section) => (
          <View key={section.title} wrap={false}>
            <Text style={styles.sectionTitle}>{section.title}</Text>
            <Text style={styles.body}>{section.body}</Text>
          </View>
        ))}
        <View style={styles.footer} fixed>
          <Text>{props.organizationName}</Text>
          <Text render={({ pageNumber, totalPages }) => `${pageNumber} / ${totalPages}`} />
        </View>
      </Page>
    </Document>
  );
}
