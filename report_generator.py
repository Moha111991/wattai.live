"""
PDF Report Generator for Energy Management System
Creates comprehensive optimization reports with charts and metrics
"""
import io
from datetime import datetime
from typing import Dict, List, Optional
import pandas as pd
import numpy as np
from reportlab.lib.pagesizes import letter, A4
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import inch
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, PageBreak, Image
from reportlab.lib import colors
from reportlab.lib.enums import TA_CENTER, TA_LEFT, TA_RIGHT
import matplotlib.pyplot as plt
import plotly.graph_objects as go


class EnergyReportGenerator:
    """
    Generates PDF reports for energy simulation results
    """
    
    def __init__(self):
        self.styles = getSampleStyleSheet()
        self._setup_custom_styles()
        
    def _setup_custom_styles(self):
        """Setup custom paragraph styles"""
        # Title style
        self.styles.add(ParagraphStyle(
            name='CustomTitle',
            parent=self.styles['Heading1'],
            fontSize=24,
            textColor=colors.HexColor('#1f77b4'),
            spaceAfter=30,
            alignment=TA_CENTER
        ))
        
        # Subtitle style
        self.styles.add(ParagraphStyle(
            name='CustomSubtitle',
            parent=self.styles['Heading2'],
            fontSize=16,
            textColor=colors.HexColor('#2ca02c'),
            spaceAfter=12,
            spaceBefore=12
        ))
        
    def generate_simulation_report(
        self,
        simulation_data: Dict,
        timeseries_df: pd.DataFrame,
        output_path: Optional[str] = None
    ) -> io.BytesIO:
        """
        Generate comprehensive PDF report for a simulation run
        
        Args:
            simulation_data: Dictionary with simulation metadata and metrics
            timeseries_df: DataFrame with time-series energy data
            output_path: Optional file path to save PDF
            
        Returns:
            BytesIO buffer containing PDF data
        """
        buffer = io.BytesIO()
        doc = SimpleDocTemplate(
            buffer if output_path is None else output_path,
            pagesize=A4,
            rightMargin=72,
            leftMargin=72,
            topMargin=72,
            bottomMargin=18,
        )
        
        # Build report elements
        elements = []
        
        # Title Page
        elements.extend(self._build_title_page(simulation_data))
        elements.append(PageBreak())
        
        # Executive Summary
        elements.extend(self._build_executive_summary(simulation_data, timeseries_df))
        elements.append(PageBreak())
        
        # Performance Metrics
        elements.extend(self._build_performance_metrics(simulation_data, timeseries_df))
        elements.append(PageBreak())
        
        # Energy Flow Analysis
        elements.extend(self._build_energy_flow_section(timeseries_df))
        elements.append(PageBreak())
        
        # Cost and CO2 Analysis
        elements.extend(self._build_cost_co2_section(simulation_data, timeseries_df))
        
        # Build PDF
        doc.build(elements)
        
        if output_path is None:
            buffer.seek(0)
            return buffer
        else:
            return buffer
    
    def _build_title_page(self, simulation_data: Dict) -> List:
        """Build title page elements"""
        elements = []
        
        # Title
        title = Paragraph(
            "Energy Management System<br/>Optimization Report",
            self.styles['CustomTitle']
        )
        elements.append(title)
        elements.append(Spacer(1, 0.5*inch))
        
        # Simulation info table
        info_data = [
            ['Simulation ID:', str(simulation_data.get('id', 'N/A'))],
            ['Agent Type:', simulation_data.get('agent_type', 'N/A')],
            ['Scenario:', simulation_data.get('scenario', 'N/A')],
            ['Simulation Date:', simulation_data.get('timestamp', datetime.now()).strftime('%Y-%m-%d %H:%M')],
            ['Duration:', f"{simulation_data.get('duration_days', 0)} days"],
        ]
        
        info_table = Table(info_data, colWidths=[2.5*inch, 3.5*inch])
        info_table.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (0, -1), colors.lightgrey),
            ('TEXTCOLOR', (0, 0), (-1, -1), colors.black),
            ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
            ('FONTNAME', (0, 0), (0, -1), 'Helvetica-Bold'),
            ('FONTSIZE', (0, 0), (-1, -1), 11),
            ('BOTTOMPADDING', (0, 0), (-1, -1), 12),
            ('GRID', (0, 0), (-1, -1), 1, colors.grey)
        ]))
        
        elements.append(info_table)
        elements.append(Spacer(1, 0.5*inch))
        
        # System configuration
        elements.append(Paragraph("System Configuration", self.styles['CustomSubtitle']))
        
        # Extract config from simulation data if available
        pv_capacity = simulation_data.get('pv_power', 10.0)
        battery_capacity = simulation_data.get('battery_capacity', 10.0)
        ev_capacity = simulation_data.get('ev_capacity', 150.0)
        ev_charge_power = simulation_data.get('ev_charge_power', 11.0)
        hp_consumption = simulation_data.get('hp_annual_consumption', 4500.0)
        household_consumption = simulation_data.get('household_annual_consumption', 4000.0)
        
        config_data = [
            ['PV Capacity:', f'{pv_capacity} kW'],
            ['Battery Storage:', f'{battery_capacity} kWh'],
            ['EV Battery:', f'{ev_capacity} kWh ({ev_charge_power} kW charging)'],
            ['Heat Pump:', f'{hp_consumption} kWh/year'],
            ['Household Load:', f'{household_consumption} kWh/year'],
        ]
        
        config_table = Table(config_data, colWidths=[2.5*inch, 3.5*inch])
        config_table.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (0, -1), colors.lightblue),
            ('TEXTCOLOR', (0, 0), (-1, -1), colors.black),
            ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
            ('FONTNAME', (0, 0), (0, -1), 'Helvetica-Bold'),
            ('FONTSIZE', (0, 0), (-1, -1), 10),
            ('BOTTOMPADDING', (0, 0), (-1, -1), 10),
            ('GRID', (0, 0), (-1, -1), 1, colors.grey)
        ]))
        
        elements.append(config_table)
        
        return elements
    
    def _build_executive_summary(self, simulation_data: Dict, df: pd.DataFrame) -> List:
        """Build executive summary section"""
        elements = []
        
        elements.append(Paragraph("Executive Summary", self.styles['CustomTitle']))
        elements.append(Spacer(1, 0.3*inch))
        
        # Key highlights
        total_cost = simulation_data.get('total_cost', 0)
        total_co2 = simulation_data.get('total_co2', 0)
        autarky_rate = simulation_data.get('autarky_rate', 0)
        
        summary_text = f"""
        This report summarizes the performance of the {simulation_data.get('agent_type', 'N/A')} 
        control strategy over a {simulation_data.get('duration_days', 0)}-day simulation period 
        in {simulation_data.get('scenario', 'N/A')} conditions.
        <br/><br/>
        <b>Key Performance Indicators:</b><br/>
        • Total Energy Cost: {total_cost:.2f} €<br/>
        • Total CO2 Emissions: {total_co2:.2f} kg CO2<br/>
        • Energy Autarky Rate: {autarky_rate*100:.1f}%<br/>
        • Peak Grid Import: {df['grid_import'].max():.2f} kW<br/>
        • Total PV Generation: {df['pv_generation'].sum():.2f} kWh<br/>
        """
        
        elements.append(Paragraph(summary_text, self.styles['BodyText']))
        elements.append(Spacer(1, 0.3*inch))
        
        return elements
    
    def _build_performance_metrics(self, simulation_data: Dict, df: pd.DataFrame) -> List:
        """Build performance metrics section"""
        elements = []
        
        elements.append(Paragraph("Performance Metrics", self.styles['CustomTitle']))
        elements.append(Spacer(1, 0.2*inch))
        
        # Calculate metrics
        total_pv = df['pv_generation'].sum()
        total_load = df['household_load'].sum() + df['hp_consumption'].sum() + df['ev_charge'].sum()
        total_import = df['grid_import'].sum()
        total_export = df['grid_export'].sum()
        
        autarky_rate = 1 - (total_import / total_load) if total_load > 0 else 0
        self_consumption = (total_pv - total_export) / total_pv if total_pv > 0 else 0
        
        metrics_data = [
            ['Metric', 'Value', 'Unit'],
            ['Total PV Generation', f'{total_pv:.2f}', 'kWh'],
            ['Total Energy Consumption', f'{total_load:.2f}', 'kWh'],
            ['Grid Import', f'{total_import:.2f}', 'kWh'],
            ['Grid Export', f'{total_export:.2f}', 'kWh'],
            ['Energy Autarky Rate', f'{autarky_rate*100:.1f}', '%'],
            ['PV Self-Consumption', f'{self_consumption*100:.1f}', '%'],
            ['Total Cost', f'{simulation_data.get("total_cost", 0):.2f}', '€'],
            ['Total CO2', f'{simulation_data.get("total_co2", 0):.2f}', 'kg'],
            ['Average Battery SOC', f'{df["battery_soc"].mean()*100:.1f}', '%'],
            ['Average EV SOC', f'{df["ev_soc"].mean()*100:.1f}', '%'],
        ]
        
        metrics_table = Table(metrics_data, colWidths=[3*inch, 2*inch, 1*inch])
        metrics_table.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#1f77b4')),
            ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
            ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
            ('ALIGN', (1, 1), (1, -1), 'RIGHT'),
            ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
            ('FONTSIZE', (0, 0), (-1, 0), 12),
            ('FONTSIZE', (0, 1), (-1, -1), 10),
            ('BOTTOMPADDING', (0, 0), (-1, -1), 8),
            ('GRID', (0, 0), (-1, -1), 1, colors.grey),
            ('ROWBACKGROUNDS', (0, 1), (-1, -1), [colors.white, colors.lightgrey])
        ]))
        
        elements.append(metrics_table)
        
        return elements
    
    def _build_energy_flow_section(self, df: pd.DataFrame) -> List:
        """Build energy flow analysis section"""
        elements = []
        
        elements.append(Paragraph("Energy Flow Analysis", self.styles['CustomTitle']))
        elements.append(Spacer(1, 0.2*inch))
        
        # Create matplotlib chart for energy flows
        fig, (ax1, ax2) = plt.subplots(2, 1, figsize=(7, 6))
        
        # Plot 1: Energy generation and consumption
        hours = range(len(df))
        ax1.plot(hours, df['pv_generation'], label='PV Generation', color='orange', linewidth=2)
        ax1.plot(hours, df['household_load'], label='Household Load', color='blue', alpha=0.7)
        ax1.plot(hours, df['hp_consumption'], label='Heat Pump', color='red', alpha=0.7)
        ax1.fill_between(hours, 0, df['ev_charge'], label='EV Charging', color='green', alpha=0.3)
        ax1.set_ylabel('Power (kW)')
        ax1.set_title('Energy Generation and Consumption')
        ax1.legend(loc='upper right', fontsize=8)
        ax1.grid(True, alpha=0.3)
        
        # Plot 2: Grid flows
        ax2.fill_between(hours, 0, df['grid_import'], label='Grid Import', color='red', alpha=0.5)
        ax2.fill_between(hours, 0, -df['grid_export'], label='Grid Export', color='green', alpha=0.5)
        ax2.set_xlabel('Hour')
        ax2.set_ylabel('Power (kW)')
        ax2.set_title('Grid Import/Export')
        ax2.legend(loc='upper right', fontsize=8)
        ax2.grid(True, alpha=0.3)
        
        plt.tight_layout()
        
        # Save chart to buffer
        img_buffer = io.BytesIO()
        plt.savefig(img_buffer, format='png', dpi=150, bbox_inches='tight')
        img_buffer.seek(0)
        plt.close()
        
        # Add image to PDF
        img = Image(img_buffer, width=6*inch, height=5*inch)
        elements.append(img)
        
        return elements
    
    def _build_cost_co2_section(self, simulation_data: Dict, df: pd.DataFrame) -> List:
        """Build cost and CO2 analysis section"""
        elements = []
        
        elements.append(Paragraph("Cost and CO2 Analysis", self.styles['CustomTitle']))
        elements.append(Spacer(1, 0.2*inch))
        
        # Create matplotlib chart
        fig, (ax1, ax2) = plt.subplots(1, 2, figsize=(7, 3))
        
        # Plot 1: Cumulative cost
        cumulative_cost = df['cost'].cumsum()
        ax1.plot(cumulative_cost, color='darkred', linewidth=2)
        ax1.set_xlabel('Hour')
        ax1.set_ylabel('Cumulative Cost (€)')
        ax1.set_title('Cost Over Time')
        ax1.grid(True, alpha=0.3)
        
        # Plot 2: Cumulative CO2
        cumulative_co2 = df['co2_emissions'].cumsum()
        ax2.plot(cumulative_co2, color='darkgreen', linewidth=2)
        ax2.set_xlabel('Hour')
        ax2.set_ylabel('Cumulative CO2 (kg)')
        ax2.set_title('CO2 Emissions Over Time')
        ax2.grid(True, alpha=0.3)
        
        plt.tight_layout()
        
        # Save chart to buffer
        img_buffer = io.BytesIO()
        plt.savefig(img_buffer, format='png', dpi=150, bbox_inches='tight')
        img_buffer.seek(0)
        plt.close()
        
        # Add image to PDF
        img = Image(img_buffer, width=6*inch, height=2.5*inch)
        elements.append(img)
        elements.append(Spacer(1, 0.2*inch))
        
        # Recommendations
        elements.append(Paragraph("Recommendations", self.styles['CustomSubtitle']))
        
        recommendations = self._generate_recommendations(simulation_data, df)
        for rec in recommendations:
            elements.append(Paragraph(f"• {rec}", self.styles['BodyText']))
            elements.append(Spacer(1, 0.1*inch))
        
        return elements
    
    def _generate_recommendations(self, simulation_data: Dict, df: pd.DataFrame) -> List[str]:
        """Generate optimization recommendations based on simulation results"""
        recommendations = []
        
        # Check autarky rate
        autarky_rate = simulation_data.get('autarky_rate', 0)
        if autarky_rate < 0.5:
            recommendations.append(
                "Consider increasing battery storage capacity to improve energy independence. "
                f"Current autarky rate is {autarky_rate*100:.1f}%."
            )
        
        # Check PV self-consumption
        total_pv = df['pv_generation'].sum()
        total_export = df['grid_export'].sum()
        if total_pv > 0:
            self_consumption = (total_pv - total_export) / total_pv
            if self_consumption < 0.6:
                recommendations.append(
                    f"PV self-consumption is {self_consumption*100:.1f}%. "
                    "Consider using V2G or scheduling flexible loads during peak PV generation."
                )
        
        # Check peak grid import
        peak_import = df['grid_import'].max()
        if peak_import > 8.0:
            recommendations.append(
                f"Peak grid import is {peak_import:.2f} kW. "
                "Consider load shifting or battery discharge during peak hours to reduce grid stress."
            )
        
        # Check EV charging strategy
        avg_ev_soc = df['ev_soc'].mean()
        if avg_ev_soc < 0.6:
            recommendations.append(
                f"Average EV state of charge is {avg_ev_soc*100:.1f}%. "
                "Consider adjusting charging strategy to ensure adequate EV availability."
            )
        
        # If no issues found
        if not recommendations:
            recommendations.append(
                "System is performing well with balanced energy flows and good self-consumption rates."
            )
        
        return recommendations


def create_energy_schedule_export(df: pd.DataFrame, battery_capacity: float = 10.0, timestep_hours: float = 1.0) -> pd.DataFrame:
    """
    Create exportable energy schedule with dispatch instructions
    
    Args:
        df: Time-series DataFrame with simulation results
        battery_capacity: Battery capacity in kWh (from simulation config)
        timestep_hours: Time step duration in hours (default: 1.0)
        
    Returns:
        Formatted DataFrame with dispatch schedule
    """
    # Calculate battery charge/discharge power from SOC changes
    # Power (kW) = Energy (kWh) / Time (h) = (ΔSOC * Capacity) / timestep
    battery_charge_kw = (df['battery_soc'].diff() * battery_capacity / timestep_hours).fillna(0)
    
    schedule = pd.DataFrame({
        'Timestamp': df.index,
        'PV_Generation_kW': df['pv_generation'].round(2),
        'Battery_Charge_kW': battery_charge_kw.round(2),
        'Battery_SOC_percent': (df['battery_soc'] * 100).round(1),
        'EV_Charge_kW': df['ev_charge'].round(2),
        'EV_SOC_percent': (df['ev_soc'] * 100).round(1),
        'Grid_Import_kW': df['grid_import'].round(2),
        'Grid_Export_kW': df['grid_export'].round(2),
        'Heat_Pump_kW': df['hp_consumption'].round(2),
        'Household_Load_kW': df['household_load'].round(2),
        'Total_Load_kW': (df['household_load'] + df['hp_consumption'] + df['ev_charge']).round(2),
        'Cost_EUR': df['cost'].round(3),
        'CO2_kg': df['co2_emissions'].round(3)
    })
    
    return schedule
